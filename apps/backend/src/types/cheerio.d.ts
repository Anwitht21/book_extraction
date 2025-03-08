declare module 'cheerio' {
  interface Cheerio<T> {
    each(func: (index: number, element: any) => void): Cheerio<T>;
    attr(name: string): string | undefined;
    text(): string;
    find(selector: string): Cheerio<T>;
  }

  interface CheerioAPI {
    (selector: string): Cheerio<any>;
    load(html: string): CheerioAPI;
  }

  function load(html: string, options?: any): CheerioAPI;
  
  export { load };
} 