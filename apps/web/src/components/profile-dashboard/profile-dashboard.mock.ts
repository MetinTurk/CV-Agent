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

export type AnalysisSkillGroup = {
  title: string
  subtitle: string
}

export type AnalysisRecommendationItem = {
  title: string
  description: string
}

export type AtsCheckResult = {
  score: number
  verdict: string
  strengths: string[]
  warnings: string[]
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
  jobAnalysis: {
    title: "İş İlanı Analizi: Kıdemli Ürün Tasarımcısı",
    company: "Stripe",
    jobLinkLabel: "İş İlanı Linki",
    workMode: "Uzaktan • Tam Zamanlı",
    score: 85,
    decision: "Karar: Başvur - Yüksek Uyum",
    strengths: [
      {
        title: "Ürün Tasarımında 5+ yıl",
        subtitle: "6 Yıl Deneyim (Eşleşti)",
      },
      {
        title: "Figma ve Tasarım Sistemleri",
        subtitle: "Sistem Lideri (Eşleşti)",
      },
    ] satisfies AnalysisSkillGroup[],
    improvements: [
      {
        title: "Güçlü Paydaş Yönetimi",
        subtitle: "Liderlik rolü (Kısmen)",
      },
      {
        title: "GraphQL Bilgisi",
        subtitle: "Geliştirme aşamasında",
      },
    ] satisfies AnalysisSkillGroup[],
    gaps: [
      {
        title: "AWS/Bulut Deneyimi",
        subtitle: "Deneyim bulunamadı",
      },
      {
        title: "Özel Teknik Yetenekler",
        subtitle: "Eksik veri",
      },
    ] satisfies AnalysisSkillGroup[],
    recommendations: [
      {
        title: "Özgeçmişinizi Güncelleyin",
        description:
          "Stripe'ın odaklandığı Figma ve Tasarım Sistemleri tecrübenizi ön plana çıkarın.",
      },
      {
        title: "Hızlı Kazanım: AWS Uygulayıcı Temelleri",
        description:
          "Terminolojiyi anlamak için 2 saatlik Coursera kursunu tamamlayarak AWS altyapısı eksikliğinizi giderin.",
      },
      {
        title: "Proje: API Paneli Yeniden Tasarımı",
        description:
          "GraphQL kavramlarını bir Figma vaka çalışmasına uygulayarak pratik deneyim kazanın.",
      },
      {
        title: "Mülakat Hazırlığı: Stripe Sistem Vakası",
        description:
          "Stripe tasarım meydan okumasının rehberli simülasyonu ile mülakata hazırlanın.",
      },
    ] satisfies AnalysisRecommendationItem[],
  },
  cvReview: {
    name: "Alex Rivera",
    title: "Principal Solutions Architect",
    summary:
      "High-impact Solutions Architect with 12+ years of experience specializing in distributed systems and cloud-native architectures. Proven track record of leading large-scale digital transformations and optimizing enterprise-grade cloud infrastructures.",
    skills: [
      "AWS (Multi-region)",
      "Kubernetes / Docker",
      "Terraform / IaC",
      "Java / Spring Boot",
      "Microservices Design",
      "Event-Driven Architecture",
    ],
    experience: {
      role: "Lead Cloud Architect",
      company: "TechFlow Corp",
      period: "2019 - Present",
      bullets: [
        "Architected a global multi-cloud delivery platform reducing latency by 40% for 5M+ users.",
        "Led the migration of 200+ legacy services to a containerized Kubernetes environment.",
        "Implemented automated CI/CD pipelines reducing deployment time from days to minutes.",
      ],
    },
    contact:
      "alex.rivera@techflow.corp | +1 (555) 0123-4567 | linkedin.com/in/arivera-architect",
  },
  atsCheck: {
    score: 78,
    verdict: "Orta-Güçlü Eşleşme",
    strengths: ["Node.js", "Express.js", "PostgreSQL", "REST API"],
    warnings: ["Docker CV'de görünmüyor.", "Unit Test deneyimi kanıtlanmamış."],
  } satisfies AtsCheckResult,
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
