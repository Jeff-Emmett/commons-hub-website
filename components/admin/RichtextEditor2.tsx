'use client'

import React, { useEffect, useState } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Level } from '@tiptap/extension-heading'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import TextStyle from '@tiptap/extension-text-style'
import { Color } from '@tiptap/extension-color'
import Youtube from '@tiptap/extension-youtube'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import ImageSelector from '@/components/admin/ImageSelector';
import { createClient } from '@/lib/supabase/client'


// Define types for the FontSize extension
import { Command } from '@tiptap/core'

interface FontSizeOptions {
  types: string[]
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    fontSize: {
      /**
       * Set the font size
       */
      setFontSize: (fontSize: string) => ReturnType
      /**
       * Unset the font size
       */
      unsetFontSize: () => ReturnType
    }
    // Add these to the root level as well for proper type recognition
    setFontSize: (fontSize: string) => ReturnType
    unsetFontSize: () => ReturnType
  }
}

// Create a custom extension for font size
const FontSize = TextStyle.extend<FontSizeOptions>({
  name: 'fontSize',
  addAttributes() {
    return {
      fontSize: {
        default: null,
        parseHTML: element => element.style.fontSize,
        renderHTML: attributes => {
          if (!attributes.fontSize) {
            return {}
          }
          return {
            style: `font-size: ${attributes.fontSize}`,
          }
        },
      },
    }
  },
  addCommands() {
    return {
      setFontSize: (fontSize: string): Command => ({ chain }) => {
        return chain().setMark('fontSize', { fontSize }).run()
      },
      unsetFontSize: (): Command => ({ chain }) => {
        return chain().unsetMark('fontSize').run()
      },
    }
  },
})

// We'll use a helper function to insert button links
const insertButtonLink = (editor: ReturnType<typeof useEditor>, url: string, text: string) => {
  // Create a wrapper span to isolate the button from other styling
  const buttonHtml = `<span class="button-wrapper"><a href="${url}" class="button" target="_blank" rel="noopener noreferrer">${text}</a></span>`;
  
  // Insert the HTML and update the editor
  if (editor) {
    editor.commands.insertContent(buttonHtml);
  }
}

const TipTapEditor = ({ value, onChange }: { value: string, onChange: (value: string) => void }) => {
  const [fontSize, setFontSize] = useState('normal')
  const [youtubeWidth, setYoutubeWidth] = useState<number | string>(640)
  const [youtubeHeight, setYoutubeHeight] = useState<number | string>(480)
  const [isImageModalOpen, setIsImageModalOpen] = useState(false)
  const editor = useEditor({
    extensions: [
      StarterKit, 
      Underline,
      TextStyle.configure({ mergeNestedSpanStyles: true }),
      FontSize,
      Color,
      Youtube.configure({
        controls: true,
        nocookie: true,
        progressBarColor: 'white',
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
        alignments: ['left', 'center', 'right', 'justify'],
        defaultAlignment: 'left',
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 underline',
        },
      }),
      Image.configure({
        inline: false,
        allowBase64: true,
        HTMLAttributes: {
          class: 'max-w-full h-auto rounded-md',
        },
      }),
      // ButtonLink removed as we're using direct HTML insertion
    ],
    content: value || '<p></p>',
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
  })

  // Update content when value prop changes
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value || '<p></p>')
    }
  }, [editor, value])

  if (!editor) {
    return null
  }

  return (
    <div className="richtext-editor border rounded-md overflow-hidden">
      <div className="flex flex-wrap bg-gray-50 p-2 border-b gap-1">
        {/* Text formatting */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-2 rounded hover:bg-gray-200 ${editor.isActive('bold') ? 'bg-gray-200' : ''}`}
          title="Bold"
        >
          <span className="font-bold">B</span>
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`p-2 rounded hover:bg-gray-200 ${editor.isActive('italic') ? 'bg-gray-200' : ''}`}
          title="Italic"
        >
          <span className="italic">I</span>
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={`p-2 rounded hover:bg-gray-200 ${editor.isActive('underline') ? 'bg-gray-200' : ''}`}
          title="Underline"
        >
          <span className="underline">U</span>
        </button>
        
        {/* List buttons */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`p-2 rounded hover:bg-gray-200 ${editor.isActive('bulletList') ? 'bg-gray-200' : ''}`}
          title="Bullet List"
        >
          <div className="flex flex-col items-start justify-center h-4 w-4">
            <div className="flex items-center">
              <div className="w-1 h-1 rounded-full bg-gray-700 mr-1"></div>
              <div className="w-3 h-0.5 bg-gray-700"></div>
            </div>
            <div className="flex items-center mt-1">
              <div className="w-1 h-1 rounded-full bg-gray-700 mr-1"></div>
              <div className="w-3 h-0.5 bg-gray-700"></div>
            </div>
          </div>
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`p-2 rounded hover:bg-gray-200 ${editor.isActive('orderedList') ? 'bg-gray-200' : ''}`}
          title="Numbered List"
        >
          <div className="flex flex-col items-start justify-center h-4 w-4">
            <div className="flex items-center">
              <div className="text-xs mr-1 leading-none">1</div>
              <div className="w-2 h-0.5 bg-gray-700"></div>
            </div>
            <div className="flex items-center mt-1">
              <div className="text-xs mr-1 leading-none">2</div>
              <div className="w-2 h-0.5 bg-gray-700"></div>
            </div>
          </div>
        </button>
        
        {/* Alignment buttons */}
        <div className="flex border-l pl-1 ml-1">
          <button
            type="button"
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
            className={`p-2 rounded hover:bg-gray-200 ${editor.isActive({ textAlign: 'left' }) ? 'bg-gray-200' : ''}`}
            title="Align Left"
          >
            <div className="flex flex-col items-start justify-center h-4 w-4">
              <div className="w-full h-0.5 bg-gray-700 mb-0.5"></div>
              <div className="w-3/4 h-0.5 bg-gray-700 mb-0.5"></div>
              <div className="w-full h-0.5 bg-gray-700"></div>
            </div>
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
            className={`p-2 rounded hover:bg-gray-200 ${editor.isActive({ textAlign: 'center' }) ? 'bg-gray-200' : ''}`}
            title="Align Center"
          >
            <div className="flex flex-col items-center justify-center h-4 w-4">
              <div className="w-full h-0.5 bg-gray-700 mb-0.5"></div>
              <div className="w-3/4 h-0.5 bg-gray-700 mb-0.5"></div>
              <div className="w-full h-0.5 bg-gray-700"></div>
            </div>
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
            className={`p-2 rounded hover:bg-gray-200 ${editor.isActive({ textAlign: 'right' }) ? 'bg-gray-200' : ''}`}
            title="Align Right"
          >
            <div className="flex flex-col items-end justify-center h-4 w-4">
              <div className="w-full h-0.5 bg-gray-700 mb-0.5"></div>
              <div className="w-3/4 h-0.5 bg-gray-700 mb-0.5"></div>
              <div className="w-full h-0.5 bg-gray-700"></div>
            </div>
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().setTextAlign('justify').run()}
            className={`p-2 rounded hover:bg-gray-200 ${editor.isActive({ textAlign: 'justify' }) ? 'bg-gray-200' : ''}`}
            title="Justify"
          >
            <div className="flex flex-col items-center justify-center h-4 w-4">
              <div className="w-full h-0.5 bg-gray-700 mb-0.5"></div>
              <div className="w-full h-0.5 bg-gray-700 mb-0.5"></div>
              <div className="w-full h-0.5 bg-gray-700"></div>
            </div>
          </button>
        </div>
        
        {/* Font size dropdown */}
        <div className="flex border-l pl-1 ml-1">
          <select
            className="p-1 rounded border hover:bg-gray-100"
            value={fontSize}
            onChange={(e) => {
              setFontSize(e.target.value);
              
              if (e.target.value === 'normal') {
                // Remove font size styling
                editor.chain().focus().unsetFontSize().run();
              } else {
                // Apply font size
                const size = e.target.value === 'small' ? '14px' : 
                           e.target.value === 'medium' ? '18px' : 
                           e.target.value === 'large' ? '24px' : '18px';
                
                editor.chain().focus().setFontSize(size).run();
              }
            }}
            title="Font Size"
          >
            <option value="small">Small</option>
            <option value="normal">Normal</option>
            <option value="medium">Medium</option>
            <option value="large">Large</option>
          </select>
        </div>
        
        {/* Heading buttons */}
        <div className="flex border-l pl-1 ml-1">
          {[1, 2, 3, 4, 5, 6].map((level) => (
            <button
              key={level}
              type="button"
              onClick={() => editor.chain().focus().toggleHeading({ level: level as Level }).run()}
              className={`p-2 rounded hover:bg-gray-200 ${editor.isActive('heading', { level }) ? 'bg-gray-200' : ''}`}
              title={`Heading ${level}`}
            >
              H{level}
            </button>
          ))}
        </div>
        
        {/* Link button */}
        <div className="flex border-l pl-1 ml-1">
          <button
            type="button"
            onClick={() => {
              const url = prompt('Enter URL');
              if (url) {
                // Check if text is selected
                if (editor.state.selection.empty) {
                  // If no text is selected, insert the URL as a link
                  editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
                } else {
                  // If text is selected, convert it to a link
                  editor.chain().focus().setLink({ href: url }).run();
                }
              } else {
                // If no URL is provided, remove the link
                editor.chain().focus().extendMarkRange('link').unsetLink().run();
              }
            }}
            className={`p-2 rounded hover:bg-gray-200 ${editor.isActive('link') ? 'bg-gray-200' : ''}`}
            title="Insert Link"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
              <path d="M4.715 6.542 3.343 7.914a3 3 0 1 0 4.243 4.243l1.828-1.829A3 3 0 0 0 8.586 5.5L8 6.086a1.002 1.002 0 0 0-.154.199 2 2 0 0 1 .861 3.337L6.88 11.45a2 2 0 1 1-2.83-2.83l.793-.792a4.018 4.018 0 0 1-.128-1.287z"/>
              <path d="M6.586 4.672A3 3 0 0 0 7.414 9.5l.775-.776a2 2 0 0 1-.896-3.346L9.12 3.55a2 2 0 1 1 2.83 2.83l-.793.792c.112.42.155.855.128 1.287l1.372-1.372a3 3 0 1 0-4.243-4.243L6.586 4.672z"/>
            </svg>
          </button>
        </div>
        
        {/* YouTube button and controls */}
        <div className="flex border-l pl-1 ml-1 items-center">
          <div className="flex items-center mr-2">
            <input
              type="number"
              min="320"
              max="1024"
              placeholder="width"
              value={youtubeWidth}
              onChange={(e) => {
                const value = e.target.value === '' ? '' : parseInt(e.target.value)
                setYoutubeWidth(value === '' ? '' : value)
              }}
              onBlur={() => {
                if (youtubeWidth === '' || (typeof youtubeWidth === 'number' && youtubeWidth < 320)) {
                  setYoutubeWidth(320)
                } else if (typeof youtubeWidth === 'number' && youtubeWidth > 1024) {
                  setYoutubeWidth(1024)
                }
              }}
              className="w-16 p-1 text-sm border rounded mr-1"
              title="Video width"
            />
            <span className="text-xs text-gray-500 mx-1">×</span>
            <input
              type="number"
              min="180"
              max="720"
              placeholder="height"
              value={youtubeHeight}
              onChange={(e) => {
                const value = e.target.value === '' ? '' : parseInt(e.target.value)
                setYoutubeHeight(value === '' ? '' : value)
              }}
              onBlur={() => {
                if (youtubeHeight === '' || (typeof youtubeHeight === 'number' && youtubeHeight < 180)) {
                  setYoutubeHeight(180)
                } else if (typeof youtubeHeight === 'number' && youtubeHeight > 720) {
                  setYoutubeHeight(720)
                }
              }}
              className="w-16 p-1 text-sm border rounded"
              title="Video height"
            />
          </div>
          <button
            type="button"
            onClick={() => {
              const url = prompt('Enter YouTube URL')
              if (url) {
                editor.chain().focus().setYoutubeVideo({
                  src: url,
                  width: typeof youtubeWidth === 'string' ? 640 : Math.max(320, youtubeWidth),
                  height: typeof youtubeHeight === 'string' ? 480 : Math.max(180, youtubeHeight),
                }).run()
              }
            }}
            className="p-2 rounded hover:bg-gray-200"
            title="Insert YouTube video"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
              <path d="M8.051 1.999h.089c.822.003 4.987.033 6.11.335a2.01 2.01 0 0 1 1.415 1.42c.101.38.172.883.22 1.402l.01.104.022.26.008.104c.065.914.073 1.77.074 1.957v.075c-.001.194-.01 1.108-.082 2.06l-.008.105-.009.104c-.05.572-.124 1.14-.235 1.558a2.007 2.007 0 0 1-1.415 1.42c-1.16.312-5.569.334-6.18.335h-.142c-.309 0-1.587-.006-2.927-.052l-.17-.006-.087-.004-.171-.007-.171-.007c-1.11-.049-2.167-.128-2.654-.26a2.007 2.007 0 0 1-1.415-1.419c-.111-.417-.185-.986-.235-1.558L.09 9.82l-.008-.104A31.4 31.4 0 0 1 0 7.68v-.123c.002-.215.01-.958.064-1.778l.007-.103.003-.052.008-.104.022-.26.01-.104c.048-.519.119-1.023.22-1.402a2.007 2.007 0 0 1 1.415-1.42c.487-.13 1.544-.21 2.654-.26l.17-.007.172-.006.086-.003.171-.007A99.788 99.788 0 0 1 7.858 2h.193zM6.4 5.209v4.818l4.157-2.408L6.4 5.209z"/>
            </svg>
          </button>
        </div>
        
        {/* Image button */}
        <div className="flex border-l pl-1 ml-1">
          <button
            type="button"
            onClick={() => setIsImageModalOpen(true)}
            className="p-2 rounded hover:bg-gray-200"
            title="Insert Image"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
              <path d="M6.002 5.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0z"/>
              <path d="M2.002 1a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V3a2 2 0 0 0-2-2h-12zm12 1a1 1 0 0 1 1 1v6.5l-3.777-1.947a.5.5 0 0 0-.577.093l-3.71 3.71-2.66-1.772a.5.5 0 0 0-.63.062L1.002 12V3a1 1 0 0 1 1-1h12z"/>
            </svg>
          </button>
        </div>
        
        {/* Button Link */}
        <div className="flex border-l pl-1 ml-1">
          <button
            type="button"
            onClick={() => {
              const url = prompt('Enter URL');
              if (url) {
                const buttonText = prompt('Enter button text', 'Click here');
                if (buttonText && editor) {
                  // Use our helper function to insert the button link
                  insertButtonLink(editor, url, buttonText);
                  
                  // Force update to ensure styling is applied
                  onChange(editor.getHTML());
                }
              }
            }}
            className="p-2 rounded hover:bg-gray-200"
            title="Insert Button Link"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
              <path d="M6.375 7.125V4.658h1.78c.973 0 1.542.457 1.542 1.237 0 .802-.604 1.23-1.764 1.23H6.375zm0 3.762h1.898c1.184 0 1.81-.48 1.81-1.377 0-.885-.65-1.348-1.886-1.348H6.375v2.725z"/>
              <path d="M4.002 0a4 4 0 0 0-4 4v8a4 4 0 0 0 4 4h8a4 4 0 0 0 4-4V4a4 4 0 0 0-4-4h-8zm0 1h8a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3h-8a3 3 0 0 1-3-3V4a3 3 0 0 1 3-3z"/>
            </svg>
          </button>
        </div>
      </div>
      <div className="p-4">
        <EditorContent editor={editor} />
      </div>
      
      {/* Image selection modal */}
      {isImageModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Select an Image</h3>
              <button 
                onClick={() => setIsImageModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <ImageSelector
              value=""
              onChange={(imageId) => {
                if (imageId && editor) {
                  // Get image URL from Supabase
                  const getImageUrl = async () => {
                    try {
                      const supabase = createClient();
                      const { data, error } = await supabase
                        .from('website_images')
                        .select('name')
                        .eq('id', imageId)
                        .single();
                        
                      if (error || !data || !data.name) {
                        console.error('Error fetching image details:', error);
                        return;
                      }
                      
                      // Construct the URL
                      const imageUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/website-images/${data.name}`;
                      
                      // Insert image into editor
                      editor.chain().focus().setImage({ src: imageUrl }).run();
                      setIsImageModalOpen(false);
                    } catch (err) {
                      console.error('Error processing image selection:', err);
                    }
                  };
                  
                  getImageUrl();
                }
              }}
              bucketName="website-images"
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default TipTapEditor
