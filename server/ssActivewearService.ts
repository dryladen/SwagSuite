import { storage } from "./storage";

interface SsActivewearConfig {
  accountNumber: string;
  apiKey: string;
}

interface SsActivewearProduct {
  sku: string;
  gtin: string;
  styleID: number;
  brandName: string;
  styleName: string;
  colorName: string;
  colorCode: string;
  sizeName: string;
  sizeCode: string;
  unitWeight: number;
  caseQty: number;
  piecePrice: number;
  dozenPrice: number;
  casePrice: number;
  customerPrice: number;
  qty: number;
  colorFrontImage: string;
  colorBackImage: string;
  colorSideImage: string;
  colorSwatchImage: string;
  countryOfOrigin: string;
}

export class SsActivewearService {
  private baseUrl = 'https://api.ssactivewear.com/V2';
  private config: SsActivewearConfig;

  constructor(config: SsActivewearConfig) {
    this.config = config;
  }

  private getAuthHeaders() {
    const credentials = Buffer.from(`${this.config.accountNumber}:${this.config.apiKey}`).toString('base64');
    return {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/json',
    };
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/products/?style=00760`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });
      
      return response.ok;
    } catch (error) {
      console.error('S&S Activewear connection test failed:', error);
      return false;
    }
  }

  async getProducts(styleFilter?: string): Promise<SsActivewearProduct[]> {
    try {
      let url = `${this.baseUrl}/products/`;
      if (styleFilter) {
        url += `?style=${encodeURIComponent(styleFilter)}`;
      } else {
        // Default to a small sample style to avoid overwhelming API
        url += `?style=00760`;
      }

      const response = await fetch(url, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`S&S Activewear API error: ${response.status} ${response.statusText}`);
      }

      const products = await response.json();
      return products;
    } catch (error) {
      console.error('Error fetching S&S Activewear products:', error);
      throw error;
    }
  }

  async searchProducts(query: string, searchType: 'sku' | 'style' | 'name' = 'sku'): Promise<SsActivewearProduct[]> {
    try {
      let queryUrl = `${this.baseUrl}/products/`;
      
      if (searchType === 'sku') {
        // Parse S&S SKU format to get style for efficient searching
        let styleNumber = '';
        
        if (query.match(/^[A-Z]\d+/)) {
          // Format like B00760033 - extract digits after letter
          const match = query.match(/^[A-Z](\d+)/);
          if (match) {
            styleNumber = match[1].substring(0, 5); // First 5 digits after letter
          }
        } else if (query.match(/^\d+/)) {
          // Format like 00760033 - first 5 digits are style
          styleNumber = query.substring(0, 5);
        }
        
        queryUrl += `?style=${styleNumber || '00760'}`;
      } else if (searchType === 'style') {
        queryUrl += `?style=${encodeURIComponent(query)}`;
      } else if (searchType === 'name') {
        // For name search, we'll search by brand or style name
        // This might require multiple API calls or a broader search
        queryUrl += `?brand=${encodeURIComponent(query)}`;
      }

      console.log(`Searching S&S Activewear with URL: ${queryUrl} (type: ${searchType})`);

      const response = await fetch(queryUrl, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        console.log(`S&S API response not OK: ${response.status} ${response.statusText}`);
        if (response.status === 404) {
          return [];
        }
        throw new Error(`S&S Activewear API error: ${response.status} ${response.statusText}`);
      }

      const products = await response.json();
      console.log(`Found ${products.length} products for ${searchType} search: ${query}`);
      
      if (!Array.isArray(products)) {
        return [];
      }

      // Filter results based on search type
      if (searchType === 'sku') {
        const exactMatch = products.find((product: SsActivewearProduct) => 
          product.sku?.toLowerCase() === query.toLowerCase()
        );
        return exactMatch ? [exactMatch] : [];
      } else if (searchType === 'name') {
        // Filter by brand name or style name containing the query
        return products.filter((product: SsActivewearProduct) => 
          product.brandName?.toLowerCase().includes(query.toLowerCase()) ||
          product.styleName?.toLowerCase().includes(query.toLowerCase())
        );
      } else {
        // For style search, return all products with that style
        return products;
      }
    } catch (error) {
      console.error('Error searching S&S Activewear products:', error);
      throw error;
    }
  }

  async getProductBySku(sku: string): Promise<SsActivewearProduct | null> {
    const results = await this.searchProducts(sku, 'sku');
    return results.length > 0 ? results[0] : null;
  }

  async getCategories(): Promise<any[]> {
    try {
      const response = await fetch(`${this.baseUrl}/categories/`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`S&S Activewear API error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching S&S Activewear categories:', error);
      throw error;
    }
  }

  async getBrands(): Promise<any[]> {
    try {
      const response = await fetch(`${this.baseUrl}/brands/`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`S&S Activewear API error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching S&S Activewear brands:', error);
      throw error;
    }
  }

  async importProducts(userId: string, styleFilter?: string): Promise<string> {
    // Create import job
    const importJob = await storage.createSsActivewearImportJob({
      userId,
      status: 'pending',
    });

    // Start import process in background
    this.processImport(importJob.id, styleFilter).catch(error => {
      console.error('Import process failed:', error);
      storage.updateSsActivewearImportJob(importJob.id, {
        status: 'failed',
        errorMessage: error.message,
        completedAt: new Date(),
      });
    });

    return importJob.id;
  }

  private async processImport(jobId: string, styleFilter?: string): Promise<void> {
    await storage.updateSsActivewearImportJob(jobId, {
      status: 'running',
      startedAt: new Date(),
    });

    try {
      const products = await this.getProducts(styleFilter);
      
      await storage.updateSsActivewearImportJob(jobId, {
        totalProducts: products.length,
      });

      let processedProducts = 0;
      let newProducts = 0;
      let updatedProducts = 0;
      let errorCount = 0;

      for (const product of products) {
        try {
          const existingProduct = await storage.getSsActivewearProductBySku(product.sku);
          
          const productData = {
            sku: product.sku,
            gtin: product.gtin,
            styleId: product.styleID,
            brandName: product.brandName,
            styleName: product.styleName,
            colorName: product.colorName,
            colorCode: product.colorCode,
            sizeName: product.sizeName,
            sizeCode: product.sizeCode,
            unitWeight: product.unitWeight?.toString(),
            caseQty: product.caseQty,
            piecePrice: product.piecePrice?.toString(),
            dozenPrice: product.dozenPrice?.toString(),
            casePrice: product.casePrice?.toString(),
            customerPrice: product.customerPrice?.toString(),
            qty: product.qty,
            colorFrontImage: product.colorFrontImage,
            colorBackImage: product.colorBackImage,
            colorSideImage: product.colorSideImage,
            colorSwatchImage: product.colorSwatchImage,
            countryOfOrigin: product.countryOfOrigin,
            lastSyncedAt: new Date(),
            updatedAt: new Date(),
          };

          if (existingProduct) {
            await storage.updateSsActivewearProduct(existingProduct.id, productData);
            updatedProducts++;
          } else {
            await storage.createSsActivewearProduct(productData);
            newProducts++;
          }

          processedProducts++;
          
          // Update progress every 10 products
          if (processedProducts % 10 === 0) {
            await storage.updateSsActivewearImportJob(jobId, {
              processedProducts,
              newProducts,
              updatedProducts,
              errorCount,
            });
          }
        } catch (error) {
          console.error(`Error processing product ${product.sku}:`, error);
          errorCount++;
        }
      }

      // Final update
      await storage.updateSsActivewearImportJob(jobId, {
        status: 'completed',
        processedProducts,
        newProducts,
        updatedProducts,
        errorCount,
        completedAt: new Date(),
      });

    } catch (error) {
      await storage.updateSsActivewearImportJob(jobId, {
        status: 'failed',
        errorMessage: error.message,
        completedAt: new Date(),
      });
      throw error;
    }
  }
}