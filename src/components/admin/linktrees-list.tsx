'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Edit, Copy, Trash2, ExternalLink, Share2, Loader2, Link as LinkIcon } from 'lucide-react'
import Link from 'next/link'

interface Linktree {
  id: string
  slug: string
  business_name: string
  description: string
  logo_url: string
}

export default function LinktreesList() {
  const [linktrees, setLinktrees] = useState<Linktree[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    fetchLinktrees()
  }, [])

  const fetchLinktrees = async () => {
    try {
      const { data, error } = await supabase
        .from('linktrees')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      setLinktrees(data || [])
    } catch (error) {
      console.error('Error fetching linktrees:', error)
      // Mock data for development when table doesn't exist yet
      setLinktrees([
        {
          id: 'mock-1',
          slug: 'origuystudio',
          business_name: 'אורי גיא סטודיו',
          description: 'סטודיו לעיצוב פרימיום.',
          logo_url: '',
        },
        {
          id: 'mock-2',
          slug: 'example',
          business_name: 'עסק לדוגמה',
          description: 'תיאור קצר של העסק לדוגמה.',
          logo_url: '',
        }
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleCopyLink = (slug: string) => {
    const url = `${window.location.origin}/${slug}`
    navigator.clipboard.writeText(url)
    // Here you could add a toast notification
    alert('הקישור הועתק ללוח!')
  }

  const handleQuickShare = (slug: string) => {
    const url = `${window.location.origin}/${slug}`
    const message = `היי! שמח לשתף איתך את עמוד הקישורים שלי:\n${url}`
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`
    window.open(whatsappUrl, '_blank')
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`האם אתה בטוח שברצונך למחוק את העץ של ${name}?`)) return
    
    try {
      const { error } = await supabase.from('linktrees').delete().eq('id', id)
      if (error) throw error
      setLinktrees(linktrees.filter(lt => lt.id !== id))
    } catch (error) {
      console.error('Error deleting linktree:', error)
      alert('אירעה שגיאה במחיקת העץ.')
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-neutral-500" />
      </div>
    )
  }

  if (linktrees.length === 0) {
    return (
      <div className="text-center py-20 border border-neutral-800 rounded-xl bg-neutral-900/50">
        <LinkIcon className="w-12 h-12 text-neutral-600 mx-auto mb-4" />
        <h3 className="text-xl font-semibold mb-2">אין לך עדיין עצי קישורים</h3>
        <p className="text-neutral-400 mb-6">צור את העץ הראשון שלך כדי להתחיל לשתף קישורים.</p>
        <Button className="bg-white text-black hover:bg-neutral-200" asChild>
          <Link href="/admin/editor/new">צור עץ חדש</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {linktrees.map((lt) => (
        <Card key={lt.id} className="border-neutral-800 bg-neutral-900 overflow-hidden flex flex-col transition-all hover:border-neutral-700 hover:shadow-lg hover:shadow-black/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-neutral-800 flex items-center justify-center shrink-0 border border-neutral-700">
                {lt.logo_url ? (
                  <img src={lt.logo_url} alt={lt.business_name} className="w-full h-full rounded-full object-cover" />
                ) : (
                  <span className="text-neutral-400 font-medium">{lt.business_name.charAt(0)}</span>
                )}
              </div>
              <div className="truncate text-right w-full">
                <div className="truncate font-semibold text-lg">{lt.business_name}</div>
                <div className="text-sm text-neutral-400 font-mono truncate" dir="ltr">{lt.slug}/</div>
              </div>
            </CardTitle>
            {lt.description && (
              <CardDescription className="text-neutral-500 line-clamp-2 mt-2 text-right">
                {lt.description}
              </CardDescription>
            )}
          </CardHeader>
          <div className="flex flex-col flex-1">
            <CardContent className="pb-4 mt-auto">
              <div className="flex gap-2">
                <Button 
                  variant="secondary" 
                  className="w-full bg-[#25D366] hover:bg-[#1ebd5b] text-white border-0"
                  onClick={() => handleQuickShare(lt.slug)}
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  שיתוף מהיר
                </Button>
              </div>
            </CardContent>
            <CardFooter className="border-t border-neutral-800 bg-neutral-950/50 p-4 m-0 flex justify-between gap-1 w-full relative z-0">
              <div className="absolute inset-0 bg-neutral-950/50 -z-10 rounded-b-xl" />
              <Button variant="ghost" size="sm" className="text-neutral-400 hover:text-white px-2" asChild>
                <Link href={`/${lt.slug}`} target="_blank">
                  <ExternalLink className="w-4 h-4 mr-1.5" />
                  צפה
                </Link>
              </Button>
              <Button variant="ghost" size="sm" className="text-neutral-400 hover:text-white px-2" onClick={() => handleCopyLink(lt.slug)}>
                <Copy className="w-4 h-4 mr-1.5" />
                העתק
              </Button>
              <Button variant="ghost" size="sm" className="text-neutral-400 hover:text-white px-2" asChild>
                <Link href={`/admin/editor/${lt.id}`}>
                  <Edit className="w-4 h-4 mr-1.5" />
                  ערוך
                </Link>
              </Button>
              <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-300 hover:bg-red-400/10 px-2" onClick={() => handleDelete(lt.id, lt.business_name)}>
                <Trash2 className="w-4 h-4 mr-1.5" />
                מחק
              </Button>
            </CardFooter>
          </div>
        </Card>
      ))}
    </div>
  )
}
