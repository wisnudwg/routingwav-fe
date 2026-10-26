import { Header } from "@/components/dashboard/header"
import { DevTools } from "@/components/notifications/dev-tools"
import { PreferencesForm } from "@/components/notifications/preferences-form"
import { PushDeviceCard } from "@/components/notifications/push-device-card"

export default function NotificationSettingsPage() {
  return (
    <>
      <Header title="Notifikasi" />
      <div className="mx-auto max-w-3xl space-y-6 p-6 md:p-8">
        <PushDeviceCard />
        <PreferencesForm />
        <DevTools />
      </div>
    </>
  )
}