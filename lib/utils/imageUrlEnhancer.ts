"use server";

import { createClient } from "@/lib/supabase/server";

// Server-side: prefer the internal HTTP URL so the Next.js image optimizer
// reaches Traefik's HTTP entrypoint (the websecure entrypoint has no router
// for /storage/v1/object/public/website-images and serves a self-signed cert).
const STORAGE_BASE_URL =
  process.env.SUPABASE_INTERNAL_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL;

/**
 * Enhances an array of items with image URLs by resolving image UUIDs to public URLs
 * 
 * @param items Array of items that contain image UUID fields
 * @param imageFieldName The name of the field containing the image UUID (default: 'image')
 * @param outputFieldName The name of the field to store the resolved URL (default: 'image_url')
 * @param bucketName The name of the storage bucket (default: 'website-images')
 * @returns The enhanced items with added image URL fields
 */
export async function enhanceWithImageUrls<T extends Record<string, unknown>>(
  items: T[], 
  imageFieldName: keyof T & string = 'image' as keyof T & string,
  outputFieldName: string = 'image_url',
  bucketName: string = 'website-images'
): Promise<(T & Record<string, string>)[]> {
  if (!items || items.length === 0) return items as (T & Record<string, string>)[];

  const supabase = await createClient();
  
  // Extract all image IDs
  const imageIds = items
    .map(item => item[imageFieldName] as string)
    .filter(Boolean);
    
  if (imageIds.length === 0) return items as (T & Record<string, string>)[];
  
  // Fetch all image names in a single query
  const { data: imageData } = await supabase
    .from('website_images')
    .select('id, name')
    .in('id', imageIds);
    
  if (!imageData) return items as (T & Record<string, string>)[];
  
  // Create a map of id -> name
  const imageMap = imageData.reduce((acc, img) => {
    if (img.id && img.name) acc[img.id] = img.name;
    return acc;
  }, {} as Record<string, string>);
  
  // Enhance items with image URLs
  return items.map(item => {
    const imageId = item[imageFieldName] as string;
    // Create a new object with the original properties
    const result = { ...item };
    
    // Add the image URL as a new property
    if (imageId && imageMap[imageId]) {
      // Use type assertion to bypass TypeScript's index signature restriction
      (result as Record<string, string>)[outputFieldName] = `${STORAGE_BASE_URL}/storage/v1/object/public/${bucketName}/${imageMap[imageId]}`;
    }
    
    return result as T & Record<string, string>;
  });
}

/**
 * Enhances nested items with image URLs by resolving image UUIDs to public URLs
 * 
 * @param items Array of parent items containing arrays of child items
 * @param nestedFieldName The name of the field containing the array of nested items
 * @param imageFieldName The name of the field containing the image UUID (default: 'image')
 * @param outputFieldName The name of the field to store the resolved URL (default: 'image_url')
 * @param bucketName The name of the storage bucket (default: 'website-images')
 * @returns The enhanced parent items with nested items containing image URLs
 */
export async function enhanceNestedWithImageUrls<T extends Record<string, unknown>, U extends Record<string, unknown>>(
  items: T[],
  nestedFieldName: keyof T & string,
  imageFieldName: keyof U & string = 'image' as keyof U & string,
  outputFieldName: string = 'image_url',
  bucketName: string = 'website-images'
): Promise<T[]> {
  if (!items || items.length === 0) return items;

  // Collect all nested items that need enhancement
  const allNestedItems: U[] = [];
  const nestedItemsMap = new Map<number, number[]>();
  
  items.forEach((item, parentIndex) => {
    const nestedItems = item[nestedFieldName] as unknown as U[];
    if (nestedItems && Array.isArray(nestedItems)) {
      nestedItemsMap.set(parentIndex, []);
      
      nestedItems.forEach((nestedItem) => {
        allNestedItems.push(nestedItem);
        nestedItemsMap.get(parentIndex)?.push(allNestedItems.length - 1);
      });
    }
  });
  
  // Enhance all nested items at once
  const enhancedNestedItems = await enhanceWithImageUrls<U>(
    allNestedItems,
    imageFieldName,
    outputFieldName,
    bucketName
  );
  
  // Put the enhanced nested items back into their parent items
  const result = [...items];
  
  nestedItemsMap.forEach((childIndices, parentIndex) => {
    const enhancedChildren = childIndices.map(idx => enhancedNestedItems[idx]);
    result[parentIndex] = {
      ...result[parentIndex],
      [nestedFieldName]: enhancedChildren
    } as T;
  });
  
  return result;
}
