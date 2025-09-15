import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function AuthCodeError() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <CardTitle>Ошибка аутентификации</CardTitle>
          <CardDescription>
            Произошла ошибка при попытке входа. Возможно, ссылка для подтверждения устарела.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p>Пожалуйста, попробуйте войти снова.</p>
          <Link href="/auth/sign-in" className="mt-4 inline-block text-sm underline">
            Вернуться на страницу входа
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
