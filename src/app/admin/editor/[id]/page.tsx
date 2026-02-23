import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import LinktreeEditor from '@/components/admin/editor/linktree-editor'

export default async function EditorPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/admin/login')
  }

  const resolvedParams = await params
  const { id } = resolvedParams
  let initialData = null

  if (id !== 'new') {
    // Fetch existing linktree
    const { data: linktree, error: linktreeError } = await supabase
      .from('linktrees')
      .select('*')
      .eq('id', id)
      .single()

    if (linktreeError || !linktree) {
      redirect('/admin/editor/new')
    }

    if (linktree) {
      // Fetch links for this linktree
      const { data: links } = await supabase
        .from('links')
        .select('*')
        .eq('linktree_id', id)
        .order('order', { ascending: true })

      initialData = { ...linktree, links: links || [] }
    }
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-50 font-sans">
      <LinktreeEditor isNew={id === 'new'} linktreeId={id} initialData={initialData} />
    </div>
  )
}
