import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Plus, LogOut } from 'lucide-react'
import LinktreesList from '@/components/admin/linktrees-list'
import Link from 'next/link'

export default async function AdminDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/admin/login')
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-50 p-6 md:p-12 font-sans">
      <div className="max-w-5xl mx-auto space-y-8">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-4">
            <img src="/logo%20omri.png" alt="Omri Logo" className="w-16 h-16 object-contain" />
            <div>
              <h1 className="text-3xl font-bold tracking-tight">ניהול עצי קישורים (Linktrees)</h1>
              <p className="text-neutral-400 mt-1">נהל את כל דפי הלקוחות שלך במקום אחד.</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button className="bg-white text-black hover:bg-neutral-200" asChild>
              <Link href="/admin/editor/new">
                <Plus className="w-4 h-4 mr-2" />
                צור עץ חדש
              </Link>
            </Button>
            <form action="/auth/signout" method="post">
              <Button variant="outline" className="border-neutral-800 text-neutral-300 hover:text-white hover:bg-neutral-900">
                <LogOut className="w-4 h-4 mr-2" />
                התנתק
              </Button>
            </form>
          </div>
        </header>
        
        <main>
          <LinktreesList />
        </main>
      </div>
    </div>
  )
}
