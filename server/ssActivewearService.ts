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

  async searchProducts(query: string): Promise<SsActivewearProduct[]> {
    try {
      // Universal search - try multiple approaches and combine results
      const searchPromises: Promise<SsActivewearProduct[]>[] = [];
      
      // 1. Try exact SKU match first
      if (query.match(/^[A-Z]?\d+/)) {
        searchPromises.push(this.searchBySku(query));
      }
      
      // 2. Try style search
      const styleNumber = this.extractStyleNumber(query);
      if (styleNumber) {
        searchPromises.push(this.searchByStyle(styleNumber));
      }
      
      // 3. Try brand/name search if query has letters
      if (query.match(/[A-Za-z]/)) {
        searchPromises.push(this.searchByName(query));
      }

      // Execute all searches in parallel and combine results
      const allResults = await Promise.allSettled(searchPromises);
      const combinedResults: SsActivewearProduct[] = [];
      const seenSkus = new Set<string>();

      for (const result of allResults) {
        if (result.status === 'fulfilled' && Array.isArray(result.value)) {
          for (const product of result.value) {
            if (!seenSkus.has(product.sku)) {
              seenSkus.add(product.sku);
              combinedResults.push(product);
            }
          }
        }
      }

      console.log(`Universal search for "${query}" found ${combinedResults.length} unique products`);
      return combinedResults;
    } catch (error) {
      console.error('Error in universal search:', error);
      throw error;
    }
  }

  private extractStyleNumber(query: string): string | null {
    if (query.match(/^[A-Z]\d+/)) {
      // Format like B00760033 - extract digits after letter
      const match = query.match(/^[A-Z](\d+)/);
      if (match) {
        return match[1].length > 5 ? match[1].substring(0, 5) : match[1];
      }
    } else if (query.match(/^\d+/)) {
      // Format like 3001 or 00760033 - use as-is if short, or first 5 digits
      return query.length > 5 ? query.substring(0, 5) : query;
    }
    return null;
  }

  private async searchBySku(query: string): Promise<SsActivewearProduct[]> {
    const styleNumber = this.extractStyleNumber(query);
    if (!styleNumber) return [];

    try {
      const queryUrl = `${this.baseUrl}/products/?style=${styleNumber}`;
      console.log(`SKU search with URL: ${queryUrl}`);

      const response = await fetch(queryUrl, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        console.log(`SKU search failed: ${response.status}`);
        return [];
      }

      const products = await response.json();
      if (!Array.isArray(products)) return [];

      // Find exact SKU match
      const exactMatch = products.find((product: SsActivewearProduct) => 
        product.sku?.toLowerCase() === query.toLowerCase()
      );
      return exactMatch ? [exactMatch] : [];
    } catch (error) {
      console.log('SKU search error:', error);
      return [];
    }
  }

  private async searchByStyle(styleNumber: string): Promise<SsActivewearProduct[]> {
    try {
      const queryUrl = `${this.baseUrl}/products/?style=${styleNumber}`;
      console.log(`Style search with URL: ${queryUrl}`);

      const response = await fetch(queryUrl, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        console.log(`Style search failed: ${response.status}`);
        return [];
      }

      const products = await response.json();
      if (!Array.isArray(products)) return [];

      // Limit results to prevent memory issues
      return products.slice(0, 50);
    } catch (error) {
      console.log('Style search error:', error);
      return [];
    }
  }

  private async searchByName(query: string): Promise<SsActivewearProduct[]> {
    try {
      // Try searching by brand first (more specific)
      const brandUrl = `${this.baseUrl}/products/?brand=${encodeURIComponent(query)}`;
      console.log(`Brand search with URL: ${brandUrl}`);

      const response = await fetch(brandUrl, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        console.log(`Brand search failed: ${response.status}`);
        return [];
      }

      const products = await response.json();
      if (!Array.isArray(products)) return [];

      // Filter by brand name or style name and limit results
      const filtered = products.filter((product: SsActivewearProduct) => 
        product.brandName?.toLowerCase().includes(query.toLowerCase()) ||
        product.styleName?.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 20);

      return filtered;
    } catch (error) {
      console.log('Name search error:', error);
      return [];
    }
  }

  async getProductBySku(sku: string): Promise<SsActivewearProduct | null> {
    const results = await this.searchProducts(sku);
    // Find exact SKU match from results
    const exactMatch = results.find(product => 
      product.sku?.toLowerCase() === sku.toLowerCase()
    );
    return exactMatch || (results.length > 0 ? results[0] : null);
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