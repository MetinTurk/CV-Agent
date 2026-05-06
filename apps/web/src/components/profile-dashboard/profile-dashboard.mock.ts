// Module: Provides static mock data for the profile dashboard UI.
import type { LucideIcon } from "lucide-react"
import {
  BriefcaseBusiness,
  FileBadge,
  FileText,
  Globe,
  GraduationCap,
  Languages,
  Mail,
  MapPin,
  Phone,
} from "lucide-react"

export type TimelineItem = {
  role: string
  company: string
  period: string
  isCurrent?: boolean
}

export type ProfileMetaItem = {
  label: string
  icon: LucideIcon
}

export type ContactItem = {
  label: string
  value: string
  icon: LucideIcon
}

export type ProjectItem = {
  title: string
  description: string
  tags: string[]
}

export type AllProjectItem = {
  title: string
  description: string
  language: string
  tone: "primary" | "secondary" | "accent"
}

export type CertificateItem = {
  title: string
  meta: string
  icon: LucideIcon
  tone: "primary" | "secondary" | "accent"
}

export const profileDashboardMock = {
  profile: {
    name: "Alex Thompson",
    title: "Kariyer bilgileri",
    avatarLabel: "AT",
    education: "İstanbul Teknik Üniversitesi - Bilgisayar Mühendisliği",
    grade: "Ortalama 3.85 / 4.00",
    completion: 85,
  },
  timeline: [
    {
      role: "Junior UI Designer",
      company: "Creative Agency",
      period: "2014 - 2016",
    },
    {
      role: "Product Designer",
      company: "Tech Solutions",
      period: "2016 - 2019",
    },
    {
      role: "Senior UX Strategist",
      company: "Innovation Lab",
      period: "2019 - Present",
      isCurrent: true,
    },
  ] satisfies TimelineItem[],
  meta: [
    {
      label: "İstanbul, Türkiye",
      icon: MapPin,
    },
    {
      label: "Tam Zamanlı",
      icon: BriefcaseBusiness,
    },
    {
      label: "Türkçe (Anadili), İngilizce (İleri Seviye)",
      icon: Languages,
    },
  ] satisfies ProfileMetaItem[],
  contact: [
    {
      label: "E-posta",
      value: "alex.thompson@example.com",
      icon: Mail,
    },
    {
      label: "Telefon",
      value: "+90 555 123 4567",
      icon: Phone,
    },
    {
      label: "LinkedIn",
      value: "linkedin.com/in/alexthompson",
      icon: Globe,
    },
  ] satisfies ContactItem[],
  projects: [
    {
      title: "E-Ticaret Tasarım Sistemi",
      description:
        "Büyük ölçekli bir e-ticaret platformu için modüler, erişilebilir ve ölçeklenebilir bir tasarım sistemi oluşturulması.",
      tags: ["Figma", "React", "Design Systems"],
    },
    {
      title: "Fintech Mobil Uygulama",
      description:
        "Kullanıcı dostu arayüzü ile kişisel finans yönetimini kolaylaştıran, ödüllü mobil uygulama tasarımı.",
      tags: ["UX Research", "iOS/Android", "Prototyping"],
    },
  ] satisfies ProjectItem[],
  allProjects: [
    {
      title: "Aether Design System",
      description:
        "React tabanlı, erişilebilir ve ölçeklenebilir bir UI bileşen kütüphanesi. Kurumsal kimlik standartlarına uygun modern web uygulamaları geliştirmek için optimize edilmiştir.",
      language: "TypeScript",
      tone: "primary",
    },
    {
      title: "Nexus AI Core",
      description:
        "Doğal dil işleme algoritmaları kullanarak kariyer analizleri üreten mikroservis mimarisi. Python ve FastAPI ile geliştirilmiş, yüksek performanslı veri işleme motoru.",
      language: "Python",
      tone: "secondary",
    },
    {
      title: "Quantum Analytics Dashboard",
      description:
        "Büyük veri setlerini görselleştiren interaktif finansal analiz paneli. Vue.js ve D3.js kullanılarak gerçek zamanlı veri akışlarını işleyecek şekilde tasarlanmıştır.",
      language: "Vue",
      tone: "accent",
    },
  ] satisfies AllProjectItem[],
  certificates: [
    {
      title: "Alex_Thompson_CV_2...",
      meta: "2.4 MB • 12 Eki 2023",
      icon: FileText,
      tone: "primary",
    },
    {
      title: "Advanced_UX_Certifica...",
      meta: "1.1 MB • 05 Eyl 2023",
      icon: FileBadge,
      tone: "secondary",
    },
    {
      title: "MSc_HCI_Diploma.pdf",
      meta: "3.8 MB • 15 Ağu 2020",
      icon: GraduationCap,
      tone: "accent",
    },
  ] satisfies CertificateItem[],
}
