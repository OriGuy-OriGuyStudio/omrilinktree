'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Save, ArrowRight, Plus, Trash2, GripVertical, Loader2, Upload, Instagram, Facebook, MessageCircle, Send } from 'lucide-react'
import LivePreview from './live-preview'
import { uploadImage } from '@/utils/supabase/storage'
import { ModeToggle } from '@/components/mode-toggle'
import confetti from 'canvas-confetti'

export interface Link {
  id: string
  title: string
  url: string
  icon: string
  order: number
  bg_color: string
  text_color: string
}

export interface LinktreeData {
  id?: string
  slug: string
  business_name: string
  description: string
  logo_url: string
  bg_type: 'solid' | 'gradient' | 'image'
  bg_value: string
  text_color: string
  links: Link[]
}

interface LinktreeEditorProps {
  isNew: boolean
  linktreeId: string
  initialData: any
}

// Helper to extract gradient parts from linear-gradient(90deg, #ff0000, #0000ff)
function parseGradient(bgValue: string) {
  if (!bgValue?.startsWith('linear-gradient')) return { angle: 90, c1: '#111111', c2: '#333333' }
  const match = bgValue.match(/linear-gradient\((\d+)deg,\s*(#[a-fA-F0-9]+|rgba?\(.*?\)),\s*(#[a-fA-F0-9]+|rgba?\(.*?\))\)/i)
  if (match) {
    return { angle: parseInt(match[1]), c1: match[2], c2: match[3] }
  }
  return { angle: 90, c1: '#111111', c2: '#333333' }
}

export default function LinktreeEditor({ isNew, linktreeId, initialData }: LinktreeEditorProps) {
  const router = useRouter()
  const supabase = createClient()
  const [isSaving, setIsSaving] = useState(false)
  const [isUploadingLogo, setIsUploadingLogo] = useState(false)
  const [isUploadingBg, setIsUploadingBg] = useState(false)

  const [data, setData] = useState<LinktreeData>({
    slug: initialData?.slug || '',
    business_name: initialData?.business_name || '',
    description: initialData?.description || '',
    logo_url: initialData?.logo_url || '',
    bg_type: initialData?.bg_type || 'solid',
    bg_value: (initialData?.bg_type === 'gradient' && !initialData?.bg_value?.startsWith('linear-gradient')) 
              ? 'linear-gradient(90deg, #111111, #333333)' // Migrate old tailwind class to standard css
              : (initialData?.bg_value || '#0e0e0e'),
    text_color: initialData?.text_color || '#ffffff',
    links: initialData?.links?.map((l: any) => ({
      ...l,
      bg_color: l.bg_color || 'rgba(255,255,255,0.1)',
      text_color: l.text_color || '#ffffff'
    })) || [],
  })

  // For gradient UI
  const grad = parseGradient(data.bg_value)
  const [gradAngle, setGradAngle] = useState(grad.angle)
  const [gradC1, setGradC1] = useState(grad.c1)
  const [gradC2, setGradC2] = useState(grad.c2)

  const handleGradientChange = (angle: number, c1: string, c2: string) => {
    setGradAngle(angle)
    setGradC1(c1)
    setGradC2(c2)
    setData(prev => ({ ...prev, bg_value: `linear-gradient(${angle}deg, ${c1}, ${c2})` }))
  }

  const handleChange = (field: keyof LinktreeData, value: any) => {
    setData((prev) => ({ ...prev, [field]: value }))
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'logo_url' | 'bg_value') => {
    const file = e.target.files?.[0]
    if (!file) return
    
    if (field === 'logo_url') setIsUploadingLogo(true)
    else setIsUploadingBg(true)

    const { url, error } = await uploadImage(file)
    
    if (error || !url) {
      alert('שגיאה בהעלאת התמונה. וודא שסקריפט מסד הנתונים הורץ. שגיאה: ' + (error?.message || 'Unknown error'))
    } else {
      handleChange(field, url)
    }

    if (field === 'logo_url') setIsUploadingLogo(false)
    else setIsUploadingBg(false)
  }

  const addLink = () => {
    const newLink: Link = {
      id: `new-${Date.now()}`,
      title: 'קישור חדש',
      url: 'https://',
      icon: 'Link',
      order: data.links.length,
      bg_color: 'rgba(255,255,255,0.1)',
      text_color: '#ffffff'
    }
    setData(prev => ({ ...prev, links: [...prev.links, newLink] }))
  }

  const addPresetLink = (title: string, icon: string, urlPrefix: string, bgColor: string, txtColor: string = '#ffffff') => {
    const newLink: Link = {
      id: `new-${Date.now()}`,
      title: title,
      url: urlPrefix,
      icon: icon,
      order: data.links.length,
      bg_color: bgColor,
      text_color: txtColor
    }
    setData(prev => ({ ...prev, links: [...prev.links, newLink] }))
  }

  const updateLink = (id: string, field: keyof Link, value: any) => {
    setData(prev => ({
      ...prev,
      links: prev.links.map(link => link.id === id ? { ...link, [field]: value } : link)
    }))
  }

  const removeLink = (id: string) => {
    setData(prev => ({
      ...prev,
      links: prev.links.filter(link => link.id !== id)
    }))
  }

  const handleSave = async () => {
    if (!data.slug || !data.business_name) {
      alert('נא למלא כתובת URL (Slug) ושם עסק לפני השמירה.')
      return
    }

    setIsSaving(true)
    try {
      let currentLinktreeId = linktreeId
      
      const linktreePayload = {
        slug: data.slug,
        business_name: data.business_name,
        description: data.description,
        logo_url: data.logo_url,
        bg_type: data.bg_type,
        bg_value: data.bg_type === 'gradient' ? `linear-gradient(${gradAngle}deg, ${gradC1}, ${gradC2})` : data.bg_value,
        text_color: data.text_color
      }

      if (isNew) {
        const { data: newLinktree, error } = await supabase
          .from('linktrees')
          .insert([linktreePayload])
          .select()
          .single()
          
        if (error) throw error
        currentLinktreeId = newLinktree.id
      } else {
        const { error } = await supabase
          .from('linktrees')
          .update(linktreePayload)
          .eq('id', currentLinktreeId)
          
        if (error) throw error
      }

      const { error: deleteError } = await supabase
        .from('links')
        .delete()
        .eq('linktree_id', currentLinktreeId)
        
      if (deleteError) throw deleteError

      if (data.links.length > 0) {
        const linksToInsert = data.links.map((link, index) => ({
          linktree_id: currentLinktreeId,
          title: link.title,
          url: link.url,
          icon: link.icon,
          order: index,
          bg_color: link.bg_color,
          text_color: link.text_color
        }))

        const { error: insertError } = await supabase
          .from('links')
          .insert(linksToInsert)
          
        if (insertError) throw insertError
      }

      // Success Confetti!
      const duration = 2000;
      const end = Date.now() + duration;

      const frame = () => {
        confetti({
          particleCount: 5,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#26ccff', '#a25afd', '#ff5e7e', '#88ff5a', '#fcff42', '#ffa62d', '#ff36ff']
        });
        confetti({
          particleCount: 5,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#26ccff', '#a25afd', '#ff5e7e', '#88ff5a', '#fcff42', '#ffa62d', '#ff36ff']
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };
      frame();

      if (isNew) {
        router.push(`/admin/editor/${currentLinktreeId}`)
      }
    } catch (error: any) {
      console.error('Error saving linktree:', error)
      alert('שגיאה בשמירה. וודא שהרצת את סקריפט ה-SQL לעדכון מסד הנתונים! פרטים: ' + (error?.message || 'שגיאה לא ידועה'))
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="flex flex-col lg:flex-row h-screen overflow-hidden">
      {/* Configuration Panel */}
      <div className="w-full lg:w-[60%] flex flex-col h-full border-l border-neutral-800 bg-neutral-950">
        <header className="flex items-center justify-between p-4 border-b shrink-0 bg-background">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.push('/admin/dashboard')} className="rounded-full">
              <ArrowRight className="w-5 h-5" />
            </Button>
            <h1 className="font-semibold text-lg">{isNew ? 'צור עץ חדש' : 'עריכת עץ'}</h1>
          </div>
          <div className="flex items-center gap-2">
            <ModeToggle />
            <Button onClick={handleSave} disabled={isSaving} className="bg-primary text-primary-foreground hover:bg-primary/90">
              {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              שמור
            </Button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-muted/30">
          <div className="max-w-xl mx-auto">
            <Tabs defaultValue="profile" dir="rtl" className="w-full">
              <TabsList className="w-full grid grid-cols-3">
                <TabsTrigger value="profile">פרופיל</TabsTrigger>
                <TabsTrigger value="links">קישורים</TabsTrigger>
                <TabsTrigger value="design">עיצוב</TabsTrigger>
              </TabsList>
              
              <TabsContent value="profile" className="space-y-6 mt-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="slug">כתובת ה-URL (Slug)</Label>
                    <div className="flex items-stretch bg-background border rounded-md overflow-hidden" dir="ltr">
                      <span className="text-muted-foreground px-3 flex items-center bg-muted border-r text-sm">site.com/</span>
                      <Input 
                        id="slug" 
                        value={data.slug} 
                        onChange={(e) => handleChange('slug', e.target.value)} 
                        className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 flex-1" 
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="business_name">שם העסק / מותג</Label>
                    <Input id="business_name" value={data.business_name} onChange={(e) => handleChange('business_name', e.target.value)} className="bg-neutral-900 border-neutral-800" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">תיאור קצר</Label>
                    <Input id="description" value={data.description} onChange={(e) => handleChange('description', e.target.value)} className="bg-neutral-900 border-neutral-800" />
                  </div>
                  <div className="space-y-4 pt-4 border-t">
                    <Label>לוגו העסק</Label>
                    <div className="flex items-center justify-between bg-muted/50 p-3 rounded-lg border">
                      <Label htmlFor="hide-logo" className="cursor-pointer">הסתר לוגו / אות ראשונה</Label>
                      <Switch 
                        id="hide-logo" 
                        checked={data.logo_url === 'hidden'} 
                        onCheckedChange={(c) => handleChange('logo_url', c ? 'hidden' : '')} 
                      />
                    </div>
                    {data.logo_url !== 'hidden' && (
                      <div className="flex gap-4 items-center mt-4">
                        <div className="w-16 h-16 rounded-full overflow-hidden shrink-0 bg-muted border-2 flex items-center justify-center">
                          {data.logo_url ? <img src={data.logo_url} className="w-full h-full object-cover" /> : <span className="text-xl font-bold">{data.business_name?.charAt(0)}</span>}
                        </div>
                        <div className="flex-1 space-y-2">
                          <Input value={data.logo_url} onChange={(e) => handleChange('logo_url', e.target.value)} placeholder="כתובת תמונה ברשת (URL)" dir="ltr" className="text-left text-xs" />
                          <div className="relative">
                            <Input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, 'logo_url')} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10" />
                            <Button size="sm" variant="secondary" className="w-full" disabled={isUploadingLogo}>
                              {isUploadingLogo ? <Loader2 className="w-4 h-4 mx-auto animate-spin" /> : <><Upload className="w-4 h-4 mr-2" /> העלאת תמונה מהמחשב</>}
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="links" className="space-y-6 mt-6">
                
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                  <Button variant="outline" size="sm" onClick={() => addPresetLink('Instagram', 'Instagram', 'https://instagram.com/', 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)')}>
                    <Instagram className="w-4 h-4 mr-2" /> אינסטגרם
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => addPresetLink('Facebook', 'Facebook', 'https://facebook.com/', '#1877F2')}>
                    <Facebook className="w-4 h-4 mr-2" /> פייסבוק
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => addPresetLink('WhatsApp', 'MessageCircle', 'https://wa.me/', '#25D366')}>
                    <MessageCircle className="w-4 h-4 mr-2" /> וואטסאפ
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => addPresetLink('Telegram', 'Send', 'https://t.me/', '#0088cc')}>
                    <Send className="w-4 h-4 mr-2" /> טלגרם
                  </Button>
                </div>

                <Button onClick={addLink} variant="secondary" className="w-full border-dashed mt-4">
                  <Plus className="w-4 h-4 mr-2" />
                  הוסף קישור מותאם אישית
                </Button>

                <div className="space-y-4 mt-6">
                  {data.links.map((link) => (
                    <div key={link.id} className="bg-card border rounded-lg p-4 flex gap-3 group shadow-sm">
                      <div className="cursor-grab pt-2 text-muted-foreground hover:text-foreground">
                        <GripVertical className="w-5 h-5" />
                      </div>
                      <div className="flex-1 space-y-3">
                        <div className="flex gap-2">
                          <Input 
                            value={link.title} 
                            onChange={(e) => updateLink(link.id, 'title', e.target.value)} 
                            placeholder="כותרת הקישור" 
                            className="bg-neutral-950 border-neutral-800 w-2/3"
                          />
                          <Input 
                            value={link.icon} 
                            onChange={(e) => updateLink(link.id, 'icon', e.target.value)} 
                            placeholder="שם אייקון (למשל Link, Youtube)" 
                            className="bg-neutral-950 border-neutral-800 w-1/3"
                            dir="ltr"
                          />
                        </div>
                        <div className="flex gap-2">
                          <Input 
                            value={link.url} 
                            onChange={(e) => updateLink(link.id, 'url', e.target.value)} 
                            placeholder="כתובת URL" 
                            dir="ltr"
                            className="bg-neutral-950 border-neutral-800 text-left"
                          />
                        </div>
                        
                        {/* Link Colors */}
                        <div className="flex gap-4 pt-4 border-t mt-2">
                          <div className="flex items-center gap-2 flex-1">
                            <Label className="text-xs text-muted-foreground shrink-0">צבע רקע</Label>
                            {/* If it's a gradient, show text input, otherwise show color picker. We will use two inputs for best UX */}
                            <div className="flex w-full gap-2">
                              <Input type="color" value={link.bg_color.length === 7 ? link.bg_color : '#ffffff'} onChange={(e) => updateLink(link.id, 'bg_color', e.target.value)} className="w-8 h-8 p-0 border-0 bg-transparent rounded-md cursor-pointer shrink-0" />
                              <Input value={link.bg_color} onChange={(e) => updateLink(link.id, 'bg_color', e.target.value)} className="h-8 text-xs font-mono" dir="ltr" />
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <Label className="text-xs text-muted-foreground">צבע טקסט</Label>
                            <Input type="color" value={link.text_color} onChange={(e) => updateLink(link.id, 'text_color', e.target.value)} className="w-8 h-8 p-0 border-0 bg-transparent rounded-md cursor-pointer" />
                          </div>
                        </div>

                      </div>
                      <Button variant="ghost" size="icon" onClick={() => removeLink(link.id)} className="text-destructive hover:bg-destructive/10 shrink-0">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  {data.links.length === 0 && (
                    <p className="text-center text-neutral-500 text-sm">אין קישורים. הוסף קישור או השתמש בתבניות למעלה.</p>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="design" className="space-y-6 mt-6">
                <div className="space-y-4">
                  
                  <div className="space-y-2 pb-4 border-b border-neutral-800">
                    <Label>צבע טקסט כללי (שם ותיאור העסק)</Label>
                    <div className="flex items-center gap-3">
                      <Input type="color" value={data.text_color || '#ffffff'} onChange={(e) => handleChange('text_color', e.target.value)} className="w-10 h-10 p-0 border-0 bg-transparent rounded-md cursor-pointer" />
                      <span className="text-sm font-mono text-neutral-400" dir="ltr">{data.text_color || '#ffffff'}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>סוג רקע</Label>
                    <div className="grid grid-cols-3 gap-2">
                      <Button 
                        variant="outline" 
                        onClick={() => handleChange('bg_type', 'solid')}
                        className={`border-neutral-800 ${data.bg_type === 'solid' ? 'bg-white text-black hover:bg-neutral-200' : 'bg-neutral-900 text-neutral-400 hover:text-white hover:bg-neutral-800'}`}
                      >
                        צבע אחיד
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => handleChange('bg_type', 'gradient')}
                        className={`border-neutral-800 ${data.bg_type === 'gradient' ? 'bg-white text-black hover:bg-neutral-200' : 'bg-neutral-900 text-neutral-400 hover:text-white hover:bg-neutral-800'}`}
                      >
                        גרדיאנט
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => handleChange('bg_type', 'image')}
                        className={`border-neutral-800 ${data.bg_type === 'image' ? 'bg-white text-black hover:bg-neutral-200' : 'bg-neutral-900 text-neutral-400 hover:text-white hover:bg-neutral-800'}`}
                      >
                        תמונה
                      </Button>
                    </div>
                  </div>
                  
                  {data.bg_type === 'solid' && (
                    <div className="space-y-4 p-4 bg-neutral-900/50 rounded-lg border border-neutral-800">
                      <Label>צבע רקע</Label>
                      <div className="flex items-center gap-3">
                        <Input type="color" value={data.bg_value.length === 7 ? data.bg_value : '#0e0e0e'} onChange={(e) => handleChange('bg_value', e.target.value)} className="w-10 h-10 p-0 border-0 bg-transparent rounded-md cursor-pointer" />
                        <span className="text-sm font-mono text-neutral-400" dir="ltr">{data.bg_value.length === 7 ? data.bg_value : '#0e0e0e'}</span>
                      </div>
                    </div>
                  )}

                  {data.bg_type === 'gradient' && (
                    <div className="space-y-4 p-4 bg-neutral-900/50 rounded-lg border border-neutral-800">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-xs text-neutral-400">צבע 1</Label>
                          <Input type="color" value={gradC1} onChange={(e) => handleGradientChange(gradAngle, e.target.value, gradC2)} className="w-full h-10 p-0 border-0 bg-transparent rounded-md cursor-pointer" />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs text-neutral-400">צבע 2</Label>
                          <Input type="color" value={gradC2} onChange={(e) => handleGradientChange(gradAngle, gradC1, e.target.value)} className="w-full h-10 p-0 border-0 bg-transparent rounded-md cursor-pointer" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <Label className="text-xs text-neutral-400">זווית ({gradAngle}°)</Label>
                        </div>
                        <Input type="range" min="0" max="360" value={gradAngle} onChange={(e) => handleGradientChange(parseInt(e.target.value), gradC1, gradC2)} className="w-full" dir="ltr" />
                      </div>
                    </div>
                  )}

                  {data.bg_type === 'image' && (
                    <div className="space-y-2 p-4 bg-neutral-900/50 rounded-lg border border-neutral-800">
                      <Label>העלאת תמונת רקע</Label>
                      <div className="space-y-2">
                        <Input value={data.bg_value} onChange={(e) => handleChange('bg_value', e.target.value)} placeholder="כתובת תמונה ברשת (URL)" dir="ltr" className="bg-neutral-950 border-neutral-800 text-left text-sm" />
                        <div className="relative mt-2">
                          <Input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, 'bg_value')} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10" />
                          <Button variant="secondary" className="w-full bg-white text-black hover:bg-neutral-200" disabled={isUploadingBg}>
                            {isUploadingBg ? <Loader2 className="w-4 h-4 mx-auto animate-spin" /> : <><Upload className="w-4 h-4 mr-2" /> העלאת תמונה מהמחשב</>}
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      {/* Live Preview Panel */}
      <div className="hidden lg:flex w-[40%] bg-[#0a0a0a] items-center justify-center p-8 border-r border-[#1a1a1a] shadow-[inset_20px_0_40px_rgba(0,0,0,0.5)]">
        <LivePreview data={data} />
      </div>
    </div>
  )
}
