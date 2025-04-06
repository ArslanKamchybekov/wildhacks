import { Card, CardDescription, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface NotFoundProps {
  message: string
}

export default function NotFound({ message }: NotFoundProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Not Found</CardTitle>
        <CardDescription>{message}</CardDescription>
      </CardHeader>
    </Card>
  )
}