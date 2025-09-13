import { createServer } from '@/lib/supabase/server'
import DemoApp from "@/components/demo-app"

export default async function Home() {
  const supabase = await createServer()
  const { data } = await supabase.auth.getUser()

  return <DemoApp user={data.user} />
}
