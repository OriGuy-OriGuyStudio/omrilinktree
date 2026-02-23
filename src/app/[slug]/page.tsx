import { createClient } from '@/utils/supabase/server'
import { notFound } from 'next/navigation'
import * as LucideIcons from 'lucide-react'
import Image from 'next/image'

export const revalidate = 60 // Revalidate every 60 seconds

export default async function PublicLinktreePage({ params }: { params: { slug: string } }) {
  const supabase = await createClient()

  const resolvedParams = await params
  const { slug } = resolvedParams

  const { data: linktree, error: linktreeError } = await supabase
    .from('linktrees')
    .select('*')
    .eq('slug', slug)
    .single()

  if (linktreeError || !linktree) {
    notFound()
  }

  const { data: links } = await supabase
    .from('links')
    .select('*')
    .eq('linktree_id', linktree.id)
    .order('order', { ascending: true })

  // Styling logic
  const bgStyle = linktree.bg_type === 'solid' ? { backgroundColor: linktree.bg_value || '#0a0a0a' } : 
                  linktree.bg_type === 'image' ? { backgroundImage: `url(${linktree.bg_value})`, backgroundSize: 'cover', backgroundAttachment: 'fixed', backgroundPosition: 'center' } : 
                  linktree.bg_type === 'gradient' ? { background: linktree.bg_value } : {}

  return (
    <div 
      className={`min-h-screen w-full flex flex-col items-center py-16 px-4`}
      style={bgStyle}
    >
      <div className="w-full max-w-[600px] flex flex-col items-center">
        
        {/* Profile Header */}
        <div 
          className="flex flex-col items-center text-center z-10 w-full mb-10 drop-shadow-md"
          style={{ color: linktree.text_color || '#ffffff' }}
        >
          {linktree.logo_url !== 'hidden' && (
            <div className="w-28 h-28 rounded-full overflow-hidden mb-5 border-2 border-white/20 shadow-xl bg-neutral-900 flex items-center justify-center shrink-0">
              {linktree.logo_url ? (
                <img src={linktree.logo_url} alt={linktree.business_name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-4xl font-bold">{linktree.business_name ? linktree.business_name.charAt(0) : ''}</span>
              )}
            </div>
          )}
          <h1 className="text-2xl font-bold tracking-tight">{linktree.business_name}</h1>
          {linktree.description && (
            <p className="text-base mt-2 max-w-sm leading-relaxed opacity-90 mx-auto">
              {linktree.description}
            </p>
          )}
        </div>

        <div className="w-full space-y-4 z-10 flex-1">
          {links?.map((link) => {
            const getIcon = (name: string) => {
              if (!name) return LucideIcons.Link;
              let pascalName = name;
              if (name.includes('-')) {
                pascalName = name.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join('');
              } else {
                pascalName = name.charAt(0).toUpperCase() + name.slice(1);
              }
              // @ts-ignore
              return LucideIcons[pascalName] || LucideIcons.Link;
            }
            const Icon = getIcon(link.icon)
            
            return (
              <a
                key={link.id}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative flex items-center justify-center w-full p-4 backdrop-blur-md rounded-xl border border-white/10 transition-all cursor-pointer overflow-hidden shadow-lg hover:shadow-white/5 hover:-translate-y-1 active:translate-y-0"
                style={{ 
                  background: link.bg_color || 'rgba(255,255,255,0.1)',
                  color: link.text_color || '#ffffff'
                }}
              >
                <div className="absolute right-4">
                  <Icon className="w-5 h-5" />
                </div>
                <span className="font-semibold text-center px-12 truncate w-full text-lg">
                  {link.title}
                </span>
                {/* Visual hover effect line */}
                <div className="absolute bottom-0 left-0 w-full h-[2px] bg-white/0 group-hover:bg-white/20 transition-all" />
              </a>
            )
          })}
        </div>

        {/* Branding Footer */}
        <div className="mt-16 text-sm text-center pb-4 z-10 font-medium tracking-widest uppercase opacity-50 transition-opacity hover:opacity-100" style={{ color: linktree.text_color || '#ffffff' }}>
          <a href="https://insights.origuystudio.com" target="_blank" rel="noopener noreferrer" className="hover:underline">
            Powered by Ori Guy Studio x Omri
          </a>
        </div>

      </div>
    </div>
  )
}
