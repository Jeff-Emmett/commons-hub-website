import { createClient } from '@/lib/supabase/server'
import { Database } from '@/lib/database.types'

// Define types for menu with pages
type Menu = Database['public']['Tables']['menu']['Row'] & {
  pages: {
    id: number
    title: string | null
    slug: string | null
  } | null
}

export async function getMenu(): Promise<Menu[] | undefined> {
  try {
    const supabase = await createClient()
    
    // First get the menu data
    const { data: menuData, error: menuError } = await supabase
      .from('menu')
      .select('*, pages(id, title, slug)')
      .order('menu_order', { ascending: true })
    
    if (menuError) {
      console.error('Error fetching menu data:', menuError);
      throw menuError;
    }
    
    
    if (!menuData || menuData.length === 0) {
      return undefined;
    }
        
    return menuData
  } catch (error) {
    console.error('Error fetching menus:', error)
    return undefined
  }
}
