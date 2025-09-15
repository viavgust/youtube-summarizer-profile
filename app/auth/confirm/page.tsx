import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function Confirm() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <CardTitle>Проверьте свою почту</CardTitle>
          <CardDescription>
            Мы отправили ссылку для подтверждения на ваш email. Пожалуйста, перейдите по ней, чтобы завершить регистрацию.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/auth/sign-in" className="text-sm underline">
            Вернуться на страницу входа
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
