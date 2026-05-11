import React, { useState, useEffect, Component } from 'react';
import { Link } from 'react-scroll';
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from 'motion/react';
import { useInView } from 'react-intersection-observer';
import { 
  Menu, 
  X, 
  Linkedin, 
  Github, 
  Facebook, 
  Globe, 
  Mail, 
  Phone, 
  MapPin, 
  Download, 
  ExternalLink,
  MessageCircle,
  Award,
  Briefcase,
  GraduationCap,
  Code2,
  User,
  CheckCircle2,
  ChevronRight,
  Send,
  Languages,
  Lock,
  LogOut,
  Trash2,
  Reply
} from 'lucide-react';
import { cn } from './lib/utils';
import { db, auth, handleFirestoreError, OperationType } from './firebase';
import { collection, addDoc, serverTimestamp, getDocs, query, orderBy, deleteDoc, doc, setDoc } from 'firebase/firestore';
import { signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from 'firebase/auth';

// --- Error Boundary ---
interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  errorInfo: string | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, errorInfo: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, errorInfo: error.message };
  }

  render() {
    if (this.state.hasError) {
      let displayMessage = "Something went wrong.";
      try {
        const parsed = JSON.parse(this.state.errorInfo || "");
        if (parsed.error && parsed.error.includes("insufficient permissions")) {
          displayMessage = "You don't have permission to perform this action. Please make sure you are logged in as an admin.";
        }
      } catch (e) {
        // Not a JSON error
      }
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
          <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center space-y-4">
            <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto">
              <X size={32} />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">Application Error</h2>
            <p className="text-gray-600">{displayMessage}</p>
            <button 
              onClick={() => window.location.reload()}
              className="w-full bg-sky-600 text-white py-3 rounded-xl font-bold hover:bg-sky-700 transition-all"
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// --- Data ---

const NAV_ITEMS = [
  { name: 'HOME', to: 'home' },
  { name: 'CERTIFICATIONS', to: 'certifications' },
  { name: 'SKILLS', to: 'skills' },
  { name: 'EXPERIENCE', to: 'experience' },
  { name: 'EDUCATION', to: 'education' },
  { name: 'PORTFOLIO', to: 'portfolio' },
  { name: 'RESUME', to: 'resume' },
  { name: 'CONTACT', to: 'contact' },
];

const STATS = [
  { label: 'Years of Experience', value: '7+' },
  { label: 'Certifications', value: '50+' },
  { label: 'Happy Clients', value: '101+' },
];

const getColorByPercentage = (percentage: number, type: 'bg' | 'text' = 'bg') => {
  if (percentage >= 90) return type === 'bg' ? 'bg-green-900' : 'text-green-900';
  if (percentage >= 80) return type === 'bg' ? 'bg-green-500' : 'text-green-500';
  if (percentage >= 70) return type === 'bg' ? 'bg-blue-600' : 'text-blue-600';
  if (percentage >= 60) return type === 'bg' ? 'bg-sky-400' : 'text-sky-400';
  if (percentage >= 50) return type === 'bg' ? 'bg-orange-500' : 'text-orange-500';
  return type === 'bg' ? 'bg-yellow-400' : 'text-yellow-400';
};

const SKILLS_CLOUD = [
  { name: 'Microsoft Azure', level: 90 },
  { name: 'Amazon Web Services (AWS)', level: 75 },
  { name: 'Huawei Cloud', level: 60 },
];

const SKILLS_RELATED = [
  { name: 'Kubernetes (CKA)', level: 75 },
  { name: 'Docker & Containers', level: 80 },
  { name: 'Linux Administration', level: 80 },
  { name: 'DevOps & CI/CD', level: 85 },
  { name: 'Terraform (IaC)', level: 65 },
  { name: 'Ansible & Automation', level: 50 },
  { name: 'Network Security', level: 80 },
  { name: 'Microsoft 365 / Entra ID', level: 95 },
  { name: 'Intune & Defender', level: 90 },
  { name: 'GitHub Enterprise', level: 90 },
  { name: 'Cloud Migration', level: 95 },
  { name: 'Troubleshooting', level: 100 },
  { name: 'Git & Version Control', level: 85 },
  { name: 'Jenkins', level: 75 },
  { name: 'GitLab CI/CD', level: 85 },
  { name: 'Azure DevOps', level: 80 },
  { name: 'Helm', level: 40 },
  { name: 'Prometheus & Grafana', level: 85 },
  { name: 'ELK Stack', level: 70 },
  { name: 'Bash Scripting', level: 80 },
  { name: 'Python', level: 75 },
  { name: 'PowerShell', level: 90 },
  { name: 'SQL & NoSQL', level: 70 },
  { name: 'Nginx & Apache', level: 85 },
  { name: 'Load Balancing', level: 85 },
  { name: 'SSL/TLS Management', level: 80 },
  { name: 'IAM & Identity', level: 95 },
  { name: 'Zero Trust Security', level: 90 },
  { name: 'Disaster Recovery', level: 95 },
  { name: 'Cost Optimization', level: 100 },
  { name: 'Technical Leadership', level: 95 },
  { name: 'Project Management', level: 85 },
  { name: 'ITIL Framework', level: 80 },
  { name: 'Agile/Scrum', level: 90 },
  { name: 'Documentation', level: 95 },
  { name: 'API Management', level: 80 },
];

const LANGUAGES = [
  { name: 'Bengali', level: 100 },
  { name: 'English', level: 85 },
  { name: 'Hindi', level: 50 },
  { name: 'Germany', level: 30 },
];

const EXPERIENCE = [
  {
    company: 'ADN Technologies Limited',
    role: 'Solution Architect - Enterprise Business',
    period: 'October 2024 - Present',
    description: [
      'Architecting robust cloud solutions in Azure and AWS to meet diverse business needs.',
      'Managing and optimizing for seamless performance and reliability.',
      'Resolving complex technical issues in Azure, AWS, Microsoft 365, and Intune.',
      'Leading successful server migrations for smooth transitions.',
      'Securing GitHub Enterprise Server within private networks to protect code repositories.',
      'Streamlining deployments using Docker, Kubernetes, and CI/CD pipelines.',
      'Monitoring security threats and managing activities within the Microsoft Partner Center.'
    ],
    logo: 'https://picsum.photos/seed/adn/100/100'
  },
  {
    company: 'Corporate Projukti Limited',
    role: 'System Engineer - Cloud Infrastructure',
    period: 'Jan 2023 - Sep 2024',
    description: [
      'Designed and implemented robust cloud architectures in Azure and Huawei Cloud.',
      'Effectively managed and monitored Azure and Huawei-based solutions.',
      'Proactively troubleshoot and resolved complex issues related to cloud services.',
      'Led successful server migrations from AWS to Huawei and Azure.',
      'Implemented secure Site-to-Site (S2S) and Point-to-Site (P2S) VPN solutions.'
    ],
    logo: 'https://picsum.photos/seed/cp/100/100'
  },
  {
    company: 'Tech Solutions Global',
    role: 'Senior Cloud & Systems Administrator',
    period: '2021 - 2022',
    description: [
      'Managed enterprise-level server infrastructure and network security across multiple regions.',
      'Implemented automated backup and disaster recovery solutions using Azure Backup and Site Recovery.',
      'Optimized system performance and reduced operational costs by 25% through resource rightsizing.',
      'Led the transition to a hybrid infrastructure model, integrating on-premises AD with Entra ID.'
    ],
    logo: 'https://picsum.photos/seed/tech/100/100'
  },
  {
    company: 'Innovative IT Services',
    role: 'Cloud Support & Network Engineer',
    period: '2018 - 2021',
    description: [
      'Provided technical leadership for cloud-based applications and infrastructure support.',
      'Assisted in large-scale cloud migration projects for financial and retail clients.',
      'Configured and maintained virtual networks, security groups, and application gateways.',
      'Managed Microsoft 365 tenants, including Exchange Online and SharePoint security.'
    ],
    logo: 'https://picsum.photos/seed/innovative/100/100'
  }
];

const PORTFOLIO = [
  {
    title: 'Email Infrastructure Modernization: Zimbra to Microsoft 365 Migration',
    category: 'Email Migration',
    description: 'Email Infrastructure Modernization: Zimbra to Microsoft 365 Migration',
    logo: 'https://picsum.photos/seed/bbf/100/100'
  },
  {
    title: 'Kubernetes Autoscaling System',
    category: 'Platform & DevOps',
    description: 'Implementation and Optimization of Kubernetes Autoscaling for Microservices Architecture',
    logo: 'https://picsum.photos/seed/ku/100/100'
  },
  {
    title: 'GitHub Enterprise Server Deployment',
    category: 'Cloud & Infrastructure',
    description: 'Secure SCM Infrastructure — GitHub Enterprise Server Deployment',
    logo: 'https://picsum.photos/seed/pb/100/100'
  },
  {
    title: 'Microsoft Cloud Deployment',
    category: 'Microsoft Services',
    description: 'End-to-End User Deployment of Microsoft Cloud Services',
    logo: 'https://picsum.photos/seed/beza/100/100'
  },
  {
    title: 'Enterprise Deployment',
    category: 'Microsoft Services',
    description: 'Secure Deployment of Microsoft Enterprise Services',
    logo: 'https://picsum.photos/seed/pb2/100/100'
  },
  {
    title: 'Microsoft Services Deployment',
    category: 'Microsoft Services',
    description: 'Enterprise Endpoint Security and Compliance Deployment using Microsoft Intune & Defender',
    logo: 'https://picsum.photos/seed/beza2/100/100'
  },
  {
    title: 'Utkorsho Platform Implementation',
    category: 'Platform & DevOps',
    description: 'Utkorsho Platform Implementation and Go-Live Project',
    logo: 'https://picsum.photos/seed/ut/100/100'
  },
  {
    title: 'Prohori GPS Tracker Migration',
    category: 'Cloud Migration',
    description: 'Prohori GPS Tracking System Digital Transformation Initiative',
    logo: 'https://picsum.photos/seed/p24/100/100'
  },
  {
    title: 'TechShopBD Migration',
    category: 'Cloud Migration',
    description: 'Migration of TechShop Platform to Scalable Cloud Architecture',
    logo: 'https://picsum.photos/seed/ts/100/100'
  },
  {
    title: 'Rokomari Cloud Migration',
    category: 'Cloud Migration',
    description: 'Rokomari Cloud Migration and Performance Enhancement Project',
    logo: 'https://picsum.photos/seed/ro/100/100'
  },
  {
    title: 'Azure IaaS Infrastructure Deployment',
    category: 'Cloud Infrastructure',
    description: 'Windows Server Deployment and Monitoring in Azure',
    logo: 'https://picsum.photos/seed/syn/100/100'
  },
  {
    title: 'Azure PaaS Web Solution Deployment',
    category: 'DevOps & PaaS',
    description: 'Infrastructure Configuration, Maintenance, and Monitoring',
    logo: 'https://picsum.photos/seed/ce/100/100'
  },
  {
    title: 'Hybrid Cloud Connectivity',
    category: 'Cloud Infrastructure',
    description: 'Implementation of Site-to-Site VPN and ExpressRoute for Hybrid Connectivity',
    logo: 'https://picsum.photos/seed/hybrid/100/100'
  },
  {
    title: 'Multi-Cloud Security Hardening',
    category: 'Security',
    description: 'Comprehensive Security Audit and Hardening for Azure and AWS Environments',
    logo: 'https://picsum.photos/seed/sec/100/100'
  },
  {
    title: 'Automated Disaster Recovery',
    category: 'Business Continuity',
    description: 'Orchestrating Automated Disaster Recovery using Azure Site Recovery',
    logo: 'https://picsum.photos/seed/dr/100/100'
  },
  {
    title: 'Identity Governance Setup',
    category: 'Identity',
    description: 'Enterprise-wide Identity Governance and Lifecycle Management with Entra ID',
    logo: 'https://picsum.photos/seed/id/100/100'
  }
];

const CERTIFICATIONS = [
  { name: 'Certified Kubernetes Administrator', issuer: 'CNCF', logo: 'https://picsum.photos/seed/cka/150/150', photo: 'https://picsum.photos/seed/cka-full/800/600', landscape: true },
  { name: 'Red Hat Certified Engineer', issuer: 'Red Hat', logo: 'https://picsum.photos/seed/rhce/150/150', photo: 'https://picsum.photos/seed/rhce-full/800/600', landscape: true },
  { name: 'Azure Solutions Architect Expert', issuer: 'Microsoft', logo: 'https://picsum.photos/seed/az305/150/150', photo: 'https://picsum.photos/seed/az305-full/800/600', landscape: true },
  { name: 'DevOps Engineer Expert', issuer: 'Microsoft', logo: 'https://picsum.photos/seed/az400/150/150', photo: 'https://picsum.photos/seed/az400-full/800/600', landscape: true },
  { name: 'Cybersecurity Architect Expert', issuer: 'Microsoft', logo: 'https://picsum.photos/seed/sc100/150/150', photo: 'https://picsum.photos/seed/sc100-full/800/600', landscape: true },
  { name: 'Power Platform Solutions Architect Expert', issuer: 'Microsoft', logo: 'https://picsum.photos/seed/pl600/150/150', photo: 'https://picsum.photos/seed/pl600-full/800/600', landscape: true },
  { name: 'Red Hat Certified System Administrator', issuer: 'Red Hat', logo: 'https://picsum.photos/seed/rhcsa/150/150', photo: 'https://picsum.photos/seed/rhcsa-full/600/800', landscape: false },
  { name: 'Windows Server Hybrid Administrator Associate', issuer: 'Microsoft', logo: 'https://picsum.photos/seed/az800/150/150', photo: 'https://picsum.photos/seed/az800-full/800/600', landscape: true },
  { name: 'Azure Administrator Associate', issuer: 'Microsoft', logo: 'https://picsum.photos/seed/az104/150/150', photo: 'https://picsum.photos/seed/az104-full/800/600', landscape: true },
  { name: 'Security Operations Analyst Associate', issuer: 'Microsoft', logo: 'https://picsum.photos/seed/sc200/150/150', photo: 'https://picsum.photos/seed/sc200-full/800/600', landscape: true },
  { name: 'Teams Administrator Associate', issuer: 'Microsoft', logo: 'https://picsum.photos/seed/ms700/150/150', photo: 'https://picsum.photos/seed/ms700-full/800/600', landscape: true },
  { name: 'Power Platform Developer Associate', issuer: 'Microsoft', logo: 'https://picsum.photos/seed/pl400/150/150', photo: 'https://picsum.photos/seed/pl400-full/800/600', landscape: true },
  { name: 'MTCNA', issuer: 'MikroTik', logo: 'https://picsum.photos/seed/mtcna/150/150', photo: 'https://picsum.photos/seed/mtcna-full/600/800', landscape: false },
  { name: 'Azure Fundamentals', issuer: 'Microsoft', logo: 'https://picsum.photos/seed/az900/150/150', photo: 'https://picsum.photos/seed/az900-full/800/600', landscape: true },
  { name: 'Azure AI Fundamentals', issuer: 'Microsoft', logo: 'https://picsum.photos/seed/ai900/150/150', photo: 'https://picsum.photos/seed/ai900-full/800/600', landscape: true },
  { name: 'Security, Compliance, and Identity Fundamentals', issuer: 'Microsoft', logo: 'https://picsum.photos/seed/sc900/150/150', photo: 'https://picsum.photos/seed/sc900-full/800/600', landscape: true },
  { name: 'Azure Data Fundamentals', issuer: 'Microsoft', logo: 'https://picsum.photos/seed/dp900/150/150', photo: 'https://picsum.photos/seed/dp900-full/800/600', landscape: true },
  { name: 'Google IT Support Certificate', issuer: 'Google', logo: 'https://picsum.photos/seed/git/150/150', photo: 'https://picsum.photos/seed/git-full/800/600', landscape: true },
  { name: 'Google Cybersecurity Certificate', issuer: 'Google', logo: 'https://picsum.photos/seed/gcs/150/150', photo: 'https://picsum.photos/seed/gcs-full/800/600', landscape: true },
  ...Array.from({ length: 23 }).map((_, i) => ({
    name: `Professional Certification ${i + 20}`,
    issuer: i % 2 === 0 ? 'Microsoft' : 'Red Hat',
    logo: `https://picsum.photos/seed/cert-${i + 20}/150/150`,
    photo: `https://picsum.photos/seed/cert-photo-${i + 20}/800/600`,
    landscape: true
  }))
];

// --- Components ---

const SectionHeading = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: false }}
    transition={{ duration: 0.6 }}
    className="text-center mb-8"
  >
    <h2 className={cn("text-3xl md:text-4xl lg:text-5xl font-black text-slate-900 relative pb-6 inline-block", className)}>
      {children}
      <motion.div 
        animate={{ width: ["0%", "100%", "0%"] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-0 left-1/2 -translate-x-1/2 h-1.5 bg-sky-600 rounded-full" 
      />
    </h2>
  </motion.div>
);

const Card = ({ children, className, onClick }: { children: React.ReactNode; className?: string; onClick?: () => void }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: false }}
    whileHover={{ y: -10, scale: 1.02 }}
    onClick={onClick}
    className={cn("bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden transition-all duration-300", className)}
  >
    {children}
  </motion.div>
);

const CircularProgress = ({ level, name }: { level: number; name: string }) => {
  const { ref, inView } = useInView({ triggerOnce: false, threshold: 0.1 });
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (level / 100) * circumference;
  const colorClass = getColorByPercentage(level, 'text');

  return (
    <div ref={ref} className="flex flex-col items-center gap-4">
      <div className="relative w-24 h-24">
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx="48"
            cy="48"
            r={radius}
            stroke="currentColor"
            strokeWidth="8"
            fill="transparent"
            className="text-slate-100"
          />
          <motion.circle
            cx="48"
            cy="48"
            r={radius}
            stroke="currentColor"
            strokeWidth="8"
            fill="transparent"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={inView ? { strokeDashoffset: offset } : { strokeDashoffset: circumference }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            className={colorClass}
          />
        </svg>
        <div className={cn("absolute inset-0 flex items-center justify-center font-black text-lg", colorClass)}>
          {level}%
        </div>
      </div>
      <span className="font-bold text-slate-700 uppercase tracking-wider text-xs">{name}</span>
    </div>
  );
};

const Counter = ({ value, duration = 2 }: { value: string; duration?: number }) => {
  const { ref, inView } = useInView({ triggerOnce: false, threshold: 0.1 });
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) => Math.round(latest));
  const [displayValue, setDisplayValue] = useState("0");

  useEffect(() => {
    if (inView) {
      const numericValue = parseInt(value.replace(/\D/g, ''));
      const controls = animate(count, numericValue, { 
        duration,
        ease: "easeOut"
      });
      return controls.stop;
    } else {
      count.set(0);
    }
  }, [inView, value, duration, count]);

  useEffect(() => {
    const unsubscribe = rounded.on("change", (v) => {
      if (value.includes('+')) {
        setDisplayValue(`${v}+`);
      } else {
        setDisplayValue(v.toString());
      }
    });
    return unsubscribe;
  }, [rounded, value]);

  return <span ref={ref}>{displayValue}</span>;
};

export default function App() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [selectedCert, setSelectedCert] = useState<typeof CERTIFICATIONS[0] | null>(null);
  const [selectedProject, setSelectedProject] = useState<typeof PORTFOLIO[0] | null>(null);
  const [isDonationModalOpen, setIsDonationModalOpen] = useState(false);
  const [formStatus, setFormStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [isCaptchaChecked, setIsCaptchaChecked] = useState(false);
  const [showCaptcha, setShowCaptcha] = useState(false);
  
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  
  // Admin & Auth State
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [adminTab, setAdminTab] = useState<'messages' | 'profile' | 'certs' | 'experience' | 'portfolio'>('messages');
  const [user, setUser] = useState<any>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [replyText, setReplyText] = useState('');
  const [activeReplyId, setActiveReplyId] = useState<string | null>(null);

  const { ref: skillsRef, inView: skillsInView } = useInView({ triggerOnce: false, threshold: 0.1 });

  const adminEmails = ["abdullahnt50@gmail.com"];
  const isAuthorizedAdmin = (user && adminEmails.includes(user.email)) || isAdminLoggedIn;

  const handleManualLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminUsername === 'Admin' && adminPassword === 'CPL@111111111') {
      setIsAdminLoggedIn(true);
    } else {
      alert("Invalid credentials");
    }
  };

  useEffect(() => {
    // Path-based backend access: open admin modal if URL is /backend
    if (window.location.pathname.endsWith('/backend')) {
      setIsAdminMode(true);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const fetchMessages = async () => {
    const path = 'messages';
    try {
      const q = query(collection(db, path), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const msgs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMessages(msgs);
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  };

  useEffect(() => {
    if (user && isAuthReady) fetchMessages();
  }, [user, isAuthReady]);

  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login failed:", error);
      alert("Login failed. Please try again.");
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setIsAdminMode(false);
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const handleDeleteMessage = async (id: string) => {
    const path = `messages/${id}`;
    try {
      await deleteDoc(doc(db, 'messages', id));
      fetchMessages();
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  };

  const handleReply = (email: string) => {
    const body = `Bekend (Acknowledged).\n\n${replyText}`;
    window.location.href = `mailto:${email}?subject=Reply to your message&body=${encodeURIComponent(body)}`;
    setReplyText('');
    setActiveReplyId(null);
  };

  const whatsappLink = "https://wa.me/8801687032087";
  const resumeLink = "https://drive.google.com/file/d/1YourResumeID/view?usp=sharing"; // Replace with actual link

  // --- Firestore Content State ---
  const [profileData, setProfileData] = useState<any>(null);
  const [dbCertifications, setDbCertifications] = useState<any[]>([]);
  const [dbSkills, setDbSkills] = useState<any[]>([]);
  const [dbLanguages, setDbLanguages] = useState<any[]>([]);
  const [dbExperience, setDbExperience] = useState<any[]>([]);
  const [dbProjects, setDbProjects] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [profSnap, certSnap, skillSnap, langSnap, expSnap, projSnap] = await Promise.all([
          getDocs(collection(db, 'profile')),
          getDocs(collection(db, 'certifications')),
          getDocs(collection(db, 'skills')),
          getDocs(collection(db, 'languages')),
          getDocs(collection(db, 'experience')),
          getDocs(collection(db, 'projects'))
        ]);

        if (!profSnap.empty) setProfileData(profSnap.docs[0].data());
        setDbCertifications(certSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as any)).sort((a, b) => (a.order || 0) - (b.order || 0)));
        setDbSkills(skillSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as any)));
        setDbLanguages(langSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as any)));
        setDbExperience(expSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as any)));
        setDbProjects(projSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as any)));
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const displayCerts = dbCertifications.length > 0 ? dbCertifications.filter(c => c.visible !== false) : CERTIFICATIONS;
  const displayPortfolio = dbProjects.length > 0 ? dbProjects.filter(p => p.visible !== false) : PORTFOLIO;
  const displayExperience = dbExperience.length > 0 ? dbExperience.filter(e => e.visible !== false) : EXPERIENCE;
  const displaySkillsCloud = dbSkills.length > 0 ? dbSkills.filter(s => s.category === 'cloud' && s.visible !== false) : SKILLS_CLOUD;
  const displaySkillsRelated = dbSkills.length > 0 ? dbSkills.filter(s => s.category === 'related' && s.visible !== false) : SKILLS_RELATED;
  const displayLanguages = dbLanguages.length > 0 ? dbLanguages.filter(l => l.visible !== false) : LANGUAGES;

  const handleContactSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormStatus('submitting');
    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get('name'),
      email: formData.get('email'),
      subject: formData.get('subject'),
      message: formData.get('message'),
      createdAt: serverTimestamp(),
    };

    const path = 'messages';
    try {
      // 1. Store in Firestore
      await addDoc(collection(db, path), {
        ...data,
        status: 'unread'
      });
      
      // 2. Sync with Google Sheets (if webhook is provided)
      const webhookUrl = (import.meta as any).env.VITE_GOOGLE_SHEET_WEBHOOK;
      if (webhookUrl) {
        try {
          await fetch(webhookUrl, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...data, createdAt: new Date().toISOString() }),
          });
        } catch (err) {
          console.error("Google Sheets sync failed:", err);
        }
      }

      setFormStatus('success');
      setIsCaptchaChecked(false);
      (e.target as HTMLFormElement).reset();
      setTimeout(() => setFormStatus('idle'), 5000);
    } catch (error) {
      console.error("Error adding document: ", error);
      try {
        handleFirestoreError(error, OperationType.CREATE, path);
      } catch (e) {
        // Error already logged and thrown, but we want to show UI feedback too
      }
      setFormStatus('error');
      setTimeout(() => setFormStatus('idle'), 5000);
    }
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-sky-100 selection:text-sky-900">
      {/* Navigation */}
      <nav className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300 px-6 py-4",
        scrolled ? "bg-slate-900/95 backdrop-blur-md shadow-lg py-3" : "bg-slate-900"
      )}>
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <img 
              src="https://picsum.photos/seed/abdullah/50/50" 
              alt="Logo" 
              className="w-10 h-10 rounded-full border-2 border-sky-500 object-cover"
              referrerPolicy="no-referrer"
            />
            <span className="text-white font-bold text-xl tracking-tight">Abdullah Al Mamun</span>
          </div>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center gap-8">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                spy={true}
                smooth={true}
                offset={-80}
                duration={500}
                className="text-gray-300 hover:text-sky-400 text-sm font-semibold cursor-pointer transition-colors"
                activeClass="text-sky-400 border-b-2 border-sky-400"
              >
                {item.name}
              </Link>
            ))}
          </div>

          {/* Mobile Menu Toggle */}
          <button 
            className="lg:hidden text-white p-2"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>

        {/* Mobile Nav */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden bg-slate-900 border-t border-slate-800 overflow-hidden"
            >
              <div className="flex flex-col p-6 gap-4">
                {NAV_ITEMS.map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    spy={true}
                    smooth={true}
                    offset={-80}
                    duration={500}
                    onClick={() => setIsMenuOpen(false)}
                    className="text-gray-300 hover:text-sky-400 text-lg font-semibold cursor-pointer"
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Hero Section */}
      <section id="home" className="flex items-center pt-28 pb-10 px-6 relative overflow-hidden">
        {/* Background Accents */}
        <div className="absolute top-0 left-0 w-full h-full -z-10">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-sky-100/50 rounded-full blur-3xl" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-50/50 rounded-full blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto grid lg:grid-cols-12 gap-16 items-center">
          <div className="lg:col-span-5 flex justify-center">
            <motion.div 
              initial={{ opacity: 0, scale: 0.8, rotate: -5 }}
              whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
              viewport={{ once: false }}
              animate={{ 
                y: [0, -15, 0],
              }}
              transition={{ 
                opacity: { duration: 0.8, ease: "easeOut" },
                scale: { duration: 0.8, ease: "easeOut" },
                rotate: { duration: 0.8, ease: "easeOut" },
                y: { duration: 4, repeat: Infinity, ease: "easeInOut" }
              }}
              className="relative group"
            >
              <div className="absolute inset-0 bg-sky-600 rounded-2xl rotate-6 group-hover:rotate-3 transition-transform duration-500 -z-10 opacity-20" />
              <div className="w-full max-w-[400px] aspect-[4/5] rounded-2xl overflow-hidden border-8 border-white shadow-2xl relative">
                <img 
                  src="https://picsum.photos/seed/abdullah-profile/800/1000" 
                  alt="Abdullah Al Mamun" 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  referrerPolicy="no-referrer"
                />
              </div>
            </motion.div>
          </div>

          <div className="lg:col-span-7 space-y-4">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="space-y-6"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-sky-50 text-sky-600 rounded-full text-xs font-black uppercase tracking-widest">
                <span className="w-2 h-2 bg-sky-600 rounded-full animate-pulse" />
                Open for Projects & Full-Time Opportunities
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 leading-[1.1] tracking-tight">
                {profileData?.heroTitle || "Abdullah Al Mamun"}
              </h1>
              <p className="text-lg md:text-xl lg:text-2xl font-bold text-slate-700 leading-tight">
                {profileData?.name || "Solution Architect | Cloud Strategist | DevOps Innovator"}
              </p>
              <div className="text-gray-500 text-lg leading-relaxed max-w-3xl space-y-4 text-justify">
                <p>
                  {profileData?.heroDescription || "I design and deliver secure, scalable, and high‑performance cloud solutions aligned with modern business needs. With hands‑on expertise across Azure, AWS, and Huawei Cloud, I help organizations modernize infrastructure, automate operations, strengthen security, and achieve operational excellence."}
                </p>
                <div className="grid md:grid-cols-2 gap-x-8 gap-y-2 text-sm font-medium">
                  <div className="flex items-center gap-2"><CheckCircle2 size={14} className="text-sky-600" /> Cloud & Hybrid Architecture Design</div>
                  <div className="flex items-center gap-2"><CheckCircle2 size={14} className="text-sky-600" /> DevOps & CI/CD Automation</div>
                  <div className="flex items-center gap-2"><CheckCircle2 size={14} className="text-sky-600" /> Kubernetes Administration</div>
                  <div className="flex items-center gap-2"><CheckCircle2 size={14} className="text-sky-600" /> Microsoft 365 & Entra ID</div>
                  <div className="flex items-center gap-2"><CheckCircle2 size={14} className="text-sky-600" /> Enterprise Endpoint Security</div>
                  <div className="flex items-center gap-2"><CheckCircle2 size={14} className="text-sky-600" /> Seamless Cloud Migrations</div>
                  <div className="flex items-center gap-2"><CheckCircle2 size={14} className="text-sky-600" /> Monitoring & Disaster Recovery</div>
                  <div className="flex items-center gap-2"><CheckCircle2 size={14} className="text-sky-600" /> Business Alignment & Strategy</div>
                </div>
                <p className="text-sm italic border-l-4 border-sky-600 pl-4 py-1 bg-sky-50/50 text-justify">
                  Certified in Azure Solutions Architecture, DevOps Engineering, Microsoft 365 Administration, and Kubernetes (CKA), I bring a strategic mindset with hands‑on technical leadership—ensuring every solution is secure, scalable, reliable, and aligned with business goals.
                </p>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="flex flex-wrap gap-4"
            >
              <Link 
                to="contact" 
                smooth={true} 
                className="bg-slate-900 text-white px-8 py-4 rounded-xl font-bold hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 cursor-pointer"
              >
                Hire Me Now
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-white pt-10 pb-12 md:pb-16 px-6 border-y border-gray-100">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          {STATS.map((stat, idx) => (
            <div key={idx} className="text-center space-y-2">
              <p className="text-5xl font-black text-sky-600">
                <Counter value={stat.value} />
              </p>
              <p className="text-gray-500 font-medium uppercase tracking-widest text-xs">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Certifications Section */}
      <section id="certifications" className="py-12 md:py-16 px-6 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <SectionHeading>Certifications</SectionHeading>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6 justify-center">
            {displayCerts.map((cert, idx) => (
              <motion.div
                key={idx}
                whileHover={{ scale: 1.1, rotate: [0, -2, 2, 0] }}
                onClick={() => setSelectedCert(cert)}
                className="bg-white p-3 rounded-xl border border-gray-100 flex flex-col items-center justify-center cursor-pointer group hover:shadow-2xl transition-all"
              >
                <div className="relative overflow-hidden rounded-lg w-full aspect-square flex items-center justify-center">
                  <img 
                    src={cert.logo} 
                    alt={cert.name} 
                    className="w-full h-full object-contain transition-all duration-500 group-hover:scale-125"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-sky-600/0 group-hover:bg-sky-600/10 transition-all flex items-center justify-center backdrop-blur-0 group-hover:backdrop-blur-[2px]">
                    <Award className="text-sky-600 opacity-0 group-hover:opacity-100 transition-all scale-50 group-hover:scale-100" size={40} />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Skills & Languages Section */}
      <section id="skills" className="py-12 md:py-20 px-6 bg-white" ref={skillsRef}>
        <div className="max-w-7xl mx-auto">
          <SectionHeading>Skills</SectionHeading>
          
          <div className="space-y-16">
            <div>
              <h3 className="text-xl font-black text-slate-900 mb-8 flex items-center gap-3">
                <span className="w-8 h-8 bg-sky-600 text-white rounded-lg flex items-center justify-center text-xs">C</span>
                Cloud Architecture
              </h3>
              <div className="grid md:grid-cols-3 gap-8">
                {SKILLS_CLOUD.map((skill, idx) => (
                  <div key={idx} className="space-y-3">
                    <div className="flex justify-between items-center text-sm font-bold text-slate-700">
                      <span>{skill.name}</span>
                      <span className={getColorByPercentage(skill.level, 'text')}>{skill.level}%</span>
                    </div>
                    <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={skillsInView ? { width: `${skill.level}%` } : { width: 0 }}
                        transition={{ duration: 1.5, ease: 'easeOut' }}
                        className={cn("h-full rounded-full", getColorByPercentage(skill.level, 'bg'))}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-xl font-black text-slate-900 mb-8 flex items-center gap-3">
                <span className="w-8 h-8 bg-slate-800 text-white rounded-lg flex items-center justify-center text-xs">R</span>
                Related Technical Skills
              </h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-8">
                {SKILLS_RELATED.map((skill, idx) => (
                  <div key={idx} className="space-y-3">
                    <div className="flex justify-between items-center text-sm font-bold text-slate-700">
                      <span>{skill.name}</span>
                      <span className={cn("font-black", getColorByPercentage(skill.level, 'text'))}>{skill.level}%</span>
                    </div>
                    <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={skillsInView ? { width: `${skill.level}%` } : { width: 0 }}
                        transition={{ duration: 1.5, ease: 'easeOut', delay: idx * 0.02 }}
                        className={cn("h-full rounded-full", getColorByPercentage(skill.level, 'bg'))}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-12">
              <h3 className="text-2xl font-black text-slate-900 mb-16 text-center uppercase tracking-widest">Language Skills</h3>
              <div className="flex flex-wrap justify-center gap-12 md:gap-24">
                {LANGUAGES.map((lang, idx) => (
                  <CircularProgress key={idx} name={lang.name} level={lang.level} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Experience Section */}
      <section id="experience" className="py-12 md:py-16 px-6 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <SectionHeading>Experience</SectionHeading>
          <div className="space-y-12">
            {EXPERIENCE.map((exp, idx) => (
              <div key={idx}>
                <Card className="p-8">
                  <div className="flex flex-col md:flex-row gap-8">
                    <div className="w-32 h-32 shrink-0 bg-white rounded-xl p-3 flex items-center justify-center border border-gray-100 shadow-sm">
                      <img src={exp.logo} alt={exp.company} className="max-w-full max-h-full object-contain" referrerPolicy="no-referrer" />
                    </div>
                    <div className="space-y-4 flex-1">
                      <div>
                        <h3 className="text-xl md:text-2xl font-bold text-slate-900">{exp.role}</h3>
                        <p className="text-sky-600 font-bold text-base md:text-lg">{exp.company}</p>
                        <p className="text-gray-400 text-xs md:text-sm font-medium mt-1">{exp.period}</p>
                      </div>
                      <ul className="space-y-2">
                        {exp.description.map((item, i) => (
                          <li key={i} className="flex items-start gap-3 text-gray-600 text-sm leading-relaxed text-justify">
                            <div className="w-1.5 h-1.5 rounded-full bg-sky-500 mt-1.5 shrink-0" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Education Section */}
      <section id="education" className="py-12 md:py-16 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <SectionHeading>Education</SectionHeading>
          <Card className="p-8">
            <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">
              <div className="w-32 h-32 shrink-0 bg-white rounded-xl p-4 flex items-center justify-center border border-gray-100 shadow-sm">
                <img src="https://picsum.photos/seed/ju/150/150" alt="University" className="max-w-full max-h-full object-contain" referrerPolicy="no-referrer" />
              </div>
              <div className="space-y-4 text-center md:text-left">
                <div>
                  <h3 className="text-xl md:text-2xl font-bold text-slate-900">Jahangirnagar University</h3>
                  <p className="text-sky-600 font-bold text-base md:text-lg">Master of Science in Information Technology</p>
                  <p className="text-gray-400 text-xs md:text-sm font-medium mt-1">Institute of Information Technology</p>
                </div>
                <p className="text-gray-600 text-sm leading-relaxed text-justify">
                  The Master of Science in Information Technology (MSc in IT) is a comprehensive graduate program designed to provide advanced knowledge and practical skills in the field of IT. Offered by the Institute of Information Technology at Jahangirnagar University, the program focuses on cutting-edge areas that align with international standards such as software engineering and application development, data science and database systems, cloud computing and distributed systems, cybersecurity and information assurance, networking and communication technologies, artificial intelligence and machine learning, and IT project management and enterprise solutions.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* Portfolio Section */}
      <section id="portfolio" className="py-12 md:py-16 px-6 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <SectionHeading>Portfolio</SectionHeading>
          <p className="text-center text-gray-500 -mt-8 mb-12 font-medium">My Recent Works</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 justify-center">
            {displayPortfolio.map((project, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className={displayPortfolio.length % 4 !== 0 && idx >= Math.floor(displayPortfolio.length / 4) * 4 ? "col-span-full md:col-span-1 lg:col-span-1 mx-auto" : ""}
              >
                <Card 
                  className="group aspect-square cursor-pointer"
                  onClick={() => setSelectedProject(project)}
                >
                  <div className="p-3 flex flex-col items-center text-center h-full justify-center">
                    <div className="w-32 h-32 mb-2 flex items-center justify-center relative bg-white rounded-xl p-3 border border-gray-50 shadow-sm">
                      <img src={project.logo} alt={project.title} className="max-w-full max-h-full object-contain grayscale group-hover:grayscale-0 transition-all duration-500" referrerPolicy="no-referrer" />
                      <div className="absolute inset-0 bg-sky-600/5 rounded-xl scale-0 group-hover:scale-110 transition-transform duration-500 opacity-0 group-hover:opacity-100" />
                    </div>
                    <h4 className="text-[12px] leading-tight font-bold text-slate-900 mb-1 group-hover:text-sky-600 transition-colors px-2">
                      {project.title}
                    </h4>
                    <span className="px-2 py-0.5 bg-sky-50 text-sky-600 text-[9px] font-bold rounded-full mb-2 uppercase tracking-wider">
                      {project.category}
                    </span>
                    <p className="text-gray-500 text-[10px] leading-relaxed line-clamp-2 text-center">
                      {project.description}
                    </p>
                    <div className="mt-3 flex items-center gap-1 text-sky-600 font-bold text-[10px] opacity-0 group-hover:opacity-100 transition-opacity">
                      View Details <ChevronRight size={12} />
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Resume Section */}
      <section id="resume" className="py-12 md:py-16 px-6 bg-white">
        <div className="max-w-7xl mx-auto text-center space-y-12">
          <SectionHeading>My Resume</SectionHeading>
          <Card className="p-12 space-y-8">
            <div className="w-20 h-20 bg-sky-50 text-sky-600 rounded-2xl flex items-center justify-center mx-auto">
              <Download size={40} />
            </div>
            <div className="space-y-4">
              <h3 className="text-3xl font-bold text-slate-900">Professional Resume</h3>
              <p className="text-gray-500 max-w-2xl mx-auto text-justify">
                Download my complete professional resume with detailed information about my experience, skills, education, and certifications in cloud architecture and DevOps.
              </p>
            </div>
            <a 
              href={resumeLink}
              download="Abdullah_Al_Mamun_Resume.pdf"
              className="bg-sky-600 hover:bg-sky-700 text-white px-8 py-4 rounded-xl font-bold flex items-center gap-2 mx-auto transition-all shadow-lg shadow-sky-200 inline-flex"
            >
              <Download size={20} />
              Download my Resume
            </a>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-8 border-t border-gray-100 text-left">
              <div>
                <p className="font-bold text-slate-900 mb-2">What's Included</p>
                <ul className="text-sm text-gray-500 space-y-1">
                  <li>• Professional Summary</li>
                  <li>• Work Experience</li>
                  <li>• Technical Skills</li>
                </ul>
              </div>
              <div>
                <p className="font-bold text-slate-900 mb-2">Additional Info</p>
                <ul className="text-sm text-gray-500 space-y-1">
                  <li>• Certifications</li>
                  <li>• Education Details</li>
                  <li>• Project Portfolio</li>
                </ul>
              </div>
              <div>
                <p className="font-bold text-slate-900 mb-2">Contact Info</p>
                <ul className="text-sm text-gray-500 space-y-1">
                  <li>• Email & Phone</li>
                  <li>• LinkedIn Profile</li>
                  <li>• Location Details</li>
                </ul>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-12 md:py-16 px-6 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <SectionHeading>Get In Touch</SectionHeading>
          <p className="text-center text-gray-500 -mt-8 mb-16 font-medium">
            Let's Keep In Touch<br />
            I am very much looking forward to hearing from you
          </p>
          
          <div className="grid lg:grid-cols-2 gap-16">
            <div className="space-y-8">
              <div className="flex items-start gap-6">
                <div className="w-12 h-12 bg-sky-600 text-white rounded-full flex items-center justify-center shrink-0">
                  <MapPin size={24} />
                </div>
                <div>
                  <p className="font-bold text-slate-900">Address:</p>
                  <p className="text-gray-600">Bangladesh</p>
                </div>
              </div>
              <div className="flex items-start gap-6">
                <div className="w-12 h-12 bg-sky-600 text-white rounded-full flex items-center justify-center shrink-0">
                  <Phone size={24} />
                </div>
                <div>
                  <p className="font-bold text-slate-900">Mobile:</p>
                  <p className="text-gray-600">+8801687032087</p>
                </div>
              </div>
              <div className="flex items-start gap-6">
                <div className="w-12 h-12 bg-sky-600 text-white rounded-full flex items-center justify-center shrink-0">
                  <Mail size={24} />
                </div>
                <div>
                  <p className="font-bold text-slate-900">Email:</p>
                  <p className="text-gray-600">Abdullah.Cloud.Dev@outlook.com</p>
                </div>
              </div>
              <div className="flex items-start gap-6">
                <div className="w-12 h-12 bg-sky-600 text-white rounded-full flex items-center justify-center shrink-0">
                  <User size={24} />
                </div>
                <div>
                  <p className="font-bold text-slate-900">Social Profiles:</p>
                  <div className="flex gap-4 mt-2">
                    <a href="https://linkedin.com/in/abdullahmahiofficial/" target="_blank" rel="noopener noreferrer" className="text-sky-600 hover:text-sky-800 transition-colors"><Linkedin size={24} /></a>
                    <a href="https://github.com/AbdullahMahiOfficial" target="_blank" rel="noopener noreferrer" className="text-slate-600 hover:text-slate-800 transition-colors"><Github size={24} /></a>
                    <a href="https://facebook.com/abdullahmahiofficial/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 transition-colors"><Facebook size={24} /></a>
                    <a href="https://abdullahmahiofficial.com/" target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:text-emerald-800 transition-colors"><Globe size={24} /></a>
                  </div>
                </div>
              </div>
            </div>

            <Card className="p-8">
              <form onSubmit={handleContactSubmit} className="space-y-6">
                <h3 className="text-2xl font-bold text-slate-900 mb-6">Leave me a message</h3>
                <p className="text-gray-500 text-sm mb-8">
                  If you have any observations, I am ready to give you feedback. The quickest way to get in touch with me is to fill up the contact form.
                </p>
                <div className="grid md:grid-cols-2 gap-6">
                  <input name="name" type="text" required placeholder="Your Name" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all" />
                  <input name="email" type="email" required placeholder="Your Email Address" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all" />
                </div>
                <input name="subject" type="text" required placeholder="Subject" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all" />
                <textarea name="message" required placeholder="Your Message" rows={4} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all resize-none"></textarea>
                
                <div className="space-y-4">
                  <div 
                    className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => !isCaptchaChecked && setShowCaptcha(true)}
                  >
                    <div className={cn(
                      "w-6 h-6 border-2 rounded flex items-center justify-center transition-all",
                      isCaptchaChecked ? "bg-green-600 border-green-600" : "bg-white border-gray-300"
                    )}>
                      {isCaptchaChecked && <CheckCircle2 size={14} className="text-white" />}
                    </div>
                    <span className="text-sm font-medium text-gray-700">I'm not a robot</span>
                    <img src="https://www.gstatic.com/recaptcha/api2/logo_48.png" alt="reCAPTCHA" className="ml-auto w-8 h-8 opacity-50" />
                  </div>

                  <AnimatePresence>
                    {showCaptcha && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="p-4 bg-white border border-gray-200 rounded-xl shadow-inner space-y-4"
                      >
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Select all images with cloud infrastructure:</p>
                        <div className="grid grid-cols-3 gap-2">
                          {[...Array(9)].map((_, i) => (
                            <div 
                              key={i} 
                              className="aspect-square bg-gray-100 rounded-lg cursor-pointer hover:opacity-80 transition-opacity overflow-hidden"
                              onClick={() => {
                                setIsCaptchaChecked(true);
                                setShowCaptcha(false);
                              }}
                            >
                              <img src={`https://picsum.photos/seed/cloud-${i}/100/100`} alt="captcha" className="w-full h-full object-cover" />
                            </div>
                          ))}
                        </div>
                        <p className="text-[10px] text-gray-400 text-center">Click any image to verify</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <AnimatePresence>
                  {formStatus === 'success' && (
                    <motion.p 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="text-green-600 font-bold text-sm flex items-center gap-2"
                    >
                      <CheckCircle2 size={16} /> Message sent successfully!
                    </motion.p>
                  )}
                  {formStatus === 'error' && (
                    <motion.p 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="text-red-600 font-bold text-sm"
                    >
                      Something went wrong. Please try again.
                    </motion.p>
                  )}
                </AnimatePresence>

                <button 
                  type="submit" 
                  disabled={formStatus === 'submitting' || !isCaptchaChecked}
                  className="w-full bg-sky-600 hover:bg-sky-700 disabled:bg-gray-400 text-white py-4 rounded-xl font-bold transition-all shadow-lg shadow-sky-100 flex items-center justify-center gap-2"
                >
                  {formStatus === 'submitting' ? 'Sending...' : <><Send size={18} /> Submit</>}
                </button>
              </form>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-6 px-6 text-center border-t border-slate-800">
        <div className="max-w-7xl mx-auto">
          <p className="text-gray-400 text-sm font-medium tracking-wide">
            Copyright © Abdullah Mahi Official. All rights reserved
          </p>
        </div>
      </footer>

      {/* Modals */}
      <AnimatePresence>
        {selectedCert && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-md"
            onClick={() => setSelectedCert(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl overflow-hidden shadow-2xl relative flex items-center justify-center"
              style={{ width: '800px', height: '600px', maxWidth: '95vw', maxHeight: '85vh' }}
              onClick={(e) => e.stopPropagation()}
            >
              <button 
                onClick={() => setSelectedCert(null)}
                className="absolute top-4 right-4 p-2 bg-white/80 backdrop-blur-sm shadow-lg rounded-full hover:bg-white transition-colors z-10 text-slate-900"
              >
                <X size={24} />
              </button>
              <div className="w-full h-full p-4 flex items-center justify-center bg-gray-50">
                <img 
                  src={selectedCert.photo} 
                  alt={selectedCert.name} 
                  className={cn(
                    "max-w-full max-h-full shadow-2xl rounded-sm object-contain",
                    selectedCert.landscape ? "w-full" : "h-full"
                  )}
                  referrerPolicy="no-referrer"
                />
              </div>
            </motion.div>
          </motion.div>
        )}

        {selectedProject && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/80 backdrop-blur-sm"
            onClick={() => setSelectedProject(null)}
          >
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              className="bg-white rounded-2xl overflow-hidden shadow-2xl relative flex flex-col"
              style={{ width: '600px', height: '300px', maxWidth: '95vw', maxHeight: '95vh' }}
              onClick={(e) => e.stopPropagation()}
            >
              <button 
                onClick={() => setSelectedProject(null)}
                className="absolute top-4 right-4 p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors z-10"
              >
                <X size={20} />
              </button>
              
              <div className="p-8 overflow-y-auto custom-scrollbar flex-1">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 bg-slate-50 rounded-xl p-3 flex items-center justify-center border border-gray-100">
                    <img src={selectedProject.logo} alt={selectedProject.title} className="max-w-full max-h-full object-contain" referrerPolicy="no-referrer" />
                  </div>
                  <div>
                    <span className="text-sky-600 font-bold text-xs uppercase tracking-widest">{selectedProject.category}</span>
                    <h3 className="text-xl font-bold text-slate-900">{selectedProject.title}</h3>
                  </div>
                </div>

                <div className="space-y-4">
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {selectedProject.description}
                  </p>
                  <div className="pt-4 border-t border-gray-100">
                    <h4 className="text-sm font-bold text-slate-900 mb-2">Project Overview</h4>
                    <p className="text-gray-500 text-xs leading-relaxed">
                      Comprehensive digital transformation strategy aimed at optimizing infrastructure performance and enhancing security protocols.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="p-4 border-t border-gray-100 bg-slate-50 flex justify-end">
                <button 
                  onClick={() => setSelectedProject(null)}
                  className="bg-slate-900 text-white px-6 py-2 rounded-lg font-bold text-sm hover:bg-slate-800 transition-all"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* WhatsApp Floating Button */}
      <div className="fixed bottom-8 right-8 z-50 flex flex-col gap-4">
        <motion.div
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsDonationModalOpen(true)}
          className="bg-amber-400 text-slate-900 p-4 rounded-full shadow-2xl hover:bg-amber-500 transition-all flex items-center justify-center group relative cursor-pointer"
        >
          <Award size={32} />
          <span className="absolute right-full mr-4 bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
            Buy Me a Coffee to Support My Next Project
          </span>
          <div className="absolute top-0 right-0 -mr-2 -mt-2 bg-red-600 text-white text-[10px] px-2 py-0.5 rounded-full font-black animate-bounce">
            COFFEE
          </div>
        </motion.div>

        <motion.a
          href={whatsappLink}
          target="_blank"
          rel="noopener noreferrer"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="bg-green-500 text-white p-4 rounded-full shadow-2xl hover:bg-green-600 transition-all flex items-center justify-center group relative"
        >
          <MessageCircle size={32} />
          <span className="absolute right-full mr-4 bg-white text-slate-900 px-4 py-2 rounded-lg text-sm font-bold shadow-xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
            Chat with me on WhatsApp
          </span>
        </motion.a>
      </div>

      {/* Donation Modal */}
      <AnimatePresence>
        {isDonationModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[120] flex items-end justify-end p-6 pointer-events-none"
          >
            {/* Transparent backdrop that handles modal close */}
            <div className="absolute inset-0 pointer-events-auto" onClick={() => setIsDonationModalOpen(false)} />
            
            <motion.div
              initial={{ scale: 0.9, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 20, opacity: 0 }}
              className="bg-white/80 backdrop-blur-xl border border-white/40 rounded-[2rem] shadow-2xl max-w-md w-full overflow-hidden relative pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <button 
                onClick={() => setIsDonationModalOpen(false)}
                className="absolute top-4 right-4 p-1.5 bg-slate-900 text-white rounded-full hover:bg-slate-800 transition-colors z-10 shadow-lg"
              >
                <X size={16} />
              </button>
              
              <div className="p-6 space-y-6">
                <div className="flex items-center gap-3 border-b border-slate-200/50 pb-4">
                  <div className="w-10 h-10 bg-amber-400 text-slate-900 rounded-xl flex items-center justify-center shadow-lg animate-pulse">
                    <Award size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900 tracking-tight italic">Support Innovation</h3>
                    <p className="text-[9px] font-black text-sky-600 uppercase tracking-widest">Help Power My Next Protocol</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Regional Tier */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                       <Globe size={14} className="text-pink-600" />
                       <span className="text-[10px] font-black text-slate-900 uppercase">Regional</span>
                    </div>
                    <div className="bg-white/50 p-3 rounded-2xl border border-slate-200/50 flex flex-col items-center gap-2 group hover:shadow-md transition-all">
                      <div className="w-20 h-20 bg-white rounded-lg shadow-sm border border-slate-100 flex items-center justify-center p-1 relative overflow-hidden">
                        <img src="https://picsum.photos/seed/region-qr/150/150" alt="Regional QR" className="w-full h-full object-contain" />
                      </div>
                      <p className="text-[8px] font-black text-slate-500 uppercase">bKash / Nagad</p>
                    </div>
                  </div>

                  {/* Global Tier */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                       <ExternalLink size={14} className="text-sky-600" />
                       <span className="text-[10px] font-black text-slate-900 uppercase">Global</span>
                    </div>
                    <div className="bg-white/50 p-3 rounded-2xl border border-slate-200/50 flex flex-col items-center gap-2 group hover:shadow-md transition-all">
                      <div className="w-20 h-20 bg-white rounded-lg shadow-sm border border-slate-100 flex items-center justify-center p-1 relative overflow-hidden">
                        <img src="https://picsum.photos/seed/global-qr/150/150" alt="Global QR" className="w-full h-full object-contain" />
                      </div>
                      <p className="text-[8px] font-black text-slate-500 uppercase">PayPal / Card</p>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <button className="w-full py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all">
                    Fuel My Coffee
                  </button>
                  <p className="text-[8px] text-slate-400 text-center font-bold italic mt-3">"Small support, big impact. Thank you."</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Admin Panel Modal */}
      <AnimatePresence>
        {isAdminMode && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-slate-900/90 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[85vh] flex flex-col overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-slate-50">
                <div className="flex flex-col">
                  <div className="flex items-center gap-3">
                    <Lock className="text-sky-600" size={24} />
                    <h2 className="text-xl font-extrabold text-slate-900 tracking-tight uppercase italic">CMS Dashboard</h2>
                  </div>
                  <span className="text-[9px] font-black text-sky-600/60 uppercase tracking-widest pl-9 italic">Path: Domain\Backend — Active Protocol</span>
                </div>
                <div className="hidden md:flex bg-white p-1 rounded-xl shadow-inner border border-gray-100">
                  {(['messages', 'profile', 'certs', 'experience', 'portfolio'] as const).map(tab => (
                    <button
                      key={tab}
                      onClick={() => setAdminTab(tab)}
                      className={cn(
                        "px-4 py-2 rounded-lg text-xs font-bold transition-all uppercase tracking-widest",
                        adminTab === tab ? "bg-slate-900 text-white shadow-md" : "text-slate-400 hover:text-slate-600"
                      )}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
                <button 
                  onClick={() => setIsAdminMode(false)}
                  className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              {!isAuthorizedAdmin ? (
                <div className="p-12 flex flex-col items-center justify-center text-center space-y-8">
                  <div className="w-16 h-16 bg-sky-50 text-sky-600 rounded-2xl flex items-center justify-center">
                    <User size={32} />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-2xl font-bold text-slate-900">Admin Access</h3>
                    <p className="text-gray-500">Sign in to access the management center</p>
                  </div>
                  
                  <form onSubmit={handleManualLogin} className="w-full max-w-sm space-y-4">
                    <div className="space-y-1 text-left">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Username</label>
                      <input 
                        type="text" 
                        value={adminUsername}
                        onChange={(e) => setAdminUsername(e.target.value)}
                        className="w-full p-4 bg-slate-50 rounded-xl border border-gray-100 focus:ring-2 focus:ring-sky-500 outline-none transition-all font-bold"
                        placeholder="Admin"
                      />
                    </div>
                    <div className="space-y-1 text-left">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Password</label>
                      <input 
                        type="password" 
                        value={adminPassword}
                        onChange={(e) => setAdminPassword(e.target.value)}
                        className="w-full p-4 bg-slate-50 rounded-xl border border-gray-100 focus:ring-2 focus:ring-sky-500 outline-none transition-all font-bold"
                        placeholder="••••••••"
                      />
                    </div>
                    <button 
                      type="submit"
                      className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold hover:bg-slate-800 transition-all shadow-lg active:scale-95"
                    >
                      Sign In
                    </button>
                  </form>

                  <div className="flex items-center gap-4 w-full max-w-sm">
                    <div className="flex-1 h-px bg-gray-100" />
                    <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">OR</span>
                    <div className="flex-1 h-px bg-gray-100" />
                  </div>

                  <button 
                    onClick={handleGoogleLogin}
                    className="flex items-center gap-3 bg-white border border-gray-200 px-8 py-4 rounded-xl font-bold text-slate-700 hover:bg-slate-50 transition-all shadow-sm"
                  >
                    <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-6 h-6" />
                    Sign in with Google
                  </button>
                </div>
              ) : (
                <div className="flex-1 overflow-hidden flex flex-col">
                  {/* Admin Toolbar */}
                  <div className="p-4 bg-sky-50 border-b border-sky-100 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        {user ? (
                          <>
                            <img src={user.photoURL} alt={user.displayName} className="w-8 h-8 rounded-full shadow-sm" />
                            <div className="absolute bottom-0 right-0 w-2 h-2 bg-green-500 rounded-full border border-white" />
                          </>
                        ) : (
                          <div className="w-8 h-8 bg-slate-800 rounded-full flex items-center justify-center text-white text-[10px] font-bold">
                            ADM
                          </div>
                        )}
                      </div>
                      <span className="text-sky-700 font-bold text-sm">
                        {user ? user.displayName : 'Manual Administrator'} (Active)
                      </span>
                    </div>
                    <button 
                      onClick={() => {
                        handleLogout();
                        setIsAdminLoggedIn(false);
                      }}
                      className="text-red-600 hover:text-red-700 font-bold text-sm flex items-center gap-2"
                    >
                      <LogOut size={16} /> Logout
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                    {adminTab === 'messages' && (
                      <div className="space-y-6">
                        <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-sky-100 shadow-sm">
                          <div className="flex items-center gap-3">
                            <img src="https://www.gstatic.com/images/branding/product/1x/sheets_2020q4_48dp.png" alt="Sheets" className="w-8 h-8" />
                            <div>
                              <h4 className="font-bold text-slate-900 text-sm italic">Google Sheets Backup</h4>
                              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Live Sync Archive</p>
                            </div>
                          </div>
                          <a 
                            href="https://docs.google.com/spreadsheets/d/1G5VU4UpA3dd6sqGsiHzIc4n3eh0wby55oW6IwbJdxYc/edit?usp=sharing" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-xs font-black text-sky-600 hover:text-sky-700 underline underline-offset-4 flex items-center gap-1"
                          >
                            Open Master Sheet <ExternalLink size={14} />
                          </a>
                        </div>

                        {messages.length === 0 ? (
                          <div className="text-center py-20 text-gray-400 bg-white rounded-2xl border border-dashed border-gray-200">
                            <MessageCircle size={48} className="mx-auto mb-4 opacity-20" />
                            <p>No messages received yet.</p>
                          </div>
                        ) : (
                          <div className="space-y-6">
                            {messages.map((msg) => (
                              <div key={msg.id} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-4">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <h4 className="font-bold text-slate-900 text-lg">{msg.name}</h4>
                                    <p className="text-sky-600 text-sm font-medium">{msg.email}</p>
                                    <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mt-1">
                                      {msg.createdAt?.toDate ? msg.createdAt.toDate().toLocaleString() : 'Just now'}
                                    </p>
                                  </div>
                                  <div className="flex gap-2">
                                    <button 
                                      onClick={() => setActiveReplyId(activeReplyId === msg.id ? null : msg.id)}
                                      className={cn(
                                        "p-2 rounded-lg transition-all",
                                        activeReplyId === msg.id ? "bg-sky-600 text-white" : "bg-sky-50 text-sky-600 hover:bg-sky-100"
                                      )}
                                    >
                                      <Reply size={18} />
                                    </button>
                                    <button 
                                      onClick={() => handleDeleteMessage(msg.id)}
                                      className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-all"
                                    >
                                      <Trash2 size={18} />
                                    </button>
                                  </div>
                                </div>
                                <div className="bg-slate-50 p-4 rounded-xl text-slate-700 text-sm border border-slate-100 italic leading-relaxed">
                                  "{msg.message}"
                                </div>
                                
                                {activeReplyId === msg.id && (
                                  <motion.div 
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="space-y-3 pt-2"
                                  >
                                    <textarea 
                                      value={replyText}
                                      onChange={(e) => setReplyText(e.target.value)}
                                      placeholder="Draft your reply (BEKEND Protocol)..."
                                      className="w-full p-4 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-sky-500 outline-none text-slate-700 min-h-[100px] shadow-inner"
                                    />
                                    <div className="flex justify-end gap-2">
                                      <button 
                                        onClick={() => setActiveReplyId(null)}
                                        className="px-4 py-2 text-slate-400 font-bold text-xs uppercase hover:text-slate-600"
                                      >
                                        Cancel
                                      </button>
                                      <button 
                                        onClick={() => handleReply(msg.email)}
                                        className="flex items-center gap-2 bg-slate-900 text-white px-6 py-2 rounded-lg font-bold text-xs uppercase hover:bg-slate-800 transition-all shadow-md active:scale-95"
                                      >
                                        Send Email <Send size={16} />
                                      </button>
                                    </div>
                                  </motion.div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {adminTab === 'profile' && (
                      <div className="space-y-8 max-w-2xl mx-auto">
                        <div className="bg-white p-8 rounded-3xl border border-gray-100 space-y-6 shadow-sm">
                          <h3 className="text-xl font-bold text-slate-900 border-b border-slate-100 pb-4 italic">Profile Dynamics</h3>
                          <div className="space-y-5">
                            <div className="space-y-2">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Professional Name</label>
                              <input 
                                type="text"
                                defaultValue={profileData?.name}
                                onBlur={async (e) => {
                                  try {
                                    const profRef = doc(db, 'profile', 'main');
                                    await setDoc(profRef, { name: e.target.value }, { merge: true });
                                    setProfileData((prev: any) => ({ ...prev, name: e.target.value }));
                                  } catch (err) { console.error(err); }
                                }}
                                className="w-full p-4 bg-slate-50 rounded-xl border-none focus:ring-2 focus:ring-sky-500 outline-none transition-all font-bold shadow-inner"
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Hero Callout</label>
                              <input 
                                type="text"
                                defaultValue={profileData?.heroTitle}
                                onBlur={async (e) => {
                                  try {
                                    const profRef = doc(db, 'profile', 'main');
                                    await setDoc(profRef, { heroTitle: e.target.value }, { merge: true });
                                    setProfileData((prev: any) => ({ ...prev, heroTitle: e.target.value }));
                                  } catch (err) { console.error(err); }
                                }}
                                className="w-full p-4 bg-slate-50 rounded-xl border-none focus:ring-2 focus:ring-sky-500 outline-none transition-all font-bold shadow-inner"
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Quick Decription</label>
                              <textarea 
                                defaultValue={profileData?.heroDescription}
                                onBlur={async (e) => {
                                  try {
                                    const profRef = doc(db, 'profile', 'main');
                                    await setDoc(profRef, { heroDescription: e.target.value }, { merge: true });
                                    setProfileData((prev: any) => ({ ...prev, heroDescription: e.target.value }));
                                  } catch (err) { console.error(err); }
                                }}
                                className="w-full p-4 bg-slate-50 rounded-xl border-none focus:ring-2 focus:ring-sky-500 outline-none transition-all text-sm shadow-inner min-h-[100px]"
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Main Bio</label>
                              <textarea 
                                defaultValue={profileData?.bio}
                                onBlur={async (e) => {
                                  try {
                                    const profRef = doc(db, 'profile', 'main');
                                    await setDoc(profRef, { bio: e.target.value }, { merge: true });
                                    setProfileData((prev: any) => ({ ...prev, bio: e.target.value }));
                                  } catch (err) { console.error(err); }
                                }}
                                className="w-full p-4 bg-slate-50 rounded-xl border-none focus:ring-2 focus:ring-sky-500 outline-none transition-all text-sm shadow-inner min-h-[150px]"
                              />
                            </div>
                          </div>
                        </div>
                        <div className="bg-sky-600 p-8 rounded-3xl text-white text-center shadow-xl shadow-sky-100">
                          <p className="font-bold uppercase tracking-widest text-xs italic">Live Context Sync Active</p>
                          <p className="text-sky-100 text-[10px] mt-1 opacity-80 font-medium">Any changes committed here reflect globally in real-time.</p>
                        </div>
                      </div>
                    )}

                    {(adminTab === 'certs' || adminTab === 'experience' || adminTab === 'portfolio') && (
                      <div className="space-y-8">
                        <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                          <div>
                            <h3 className="text-lg font-bold text-slate-900 uppercase italic tracking-tight">Active Repositories</h3>
                            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Managing: {adminTab}</p>
                          </div>
                          <button 
                            onClick={async () => {
                              const name = prompt(`Enter ${adminTab === 'certs' ? 'Certification' : adminTab === 'experience' ? 'Company' : 'Project'} Name:`);
                              if (!name) return;
                              const logo = prompt("Enter Logo URL (or leave blank for random):") || `https://picsum.photos/seed/${Math.random()}/200/200`;
                              
                              try {
                                const coll = adminTab === 'certs' ? 'certifications' : adminTab === 'experience' ? 'experience' : 'projects';
                                await addDoc(collection(db, coll), {
                                  name,
                                  logo,
                                  visible: true,
                                  createdAt: serverTimestamp(),
                                  order: Date.now()
                                });
                                window.location.reload(); // Quick refresh to show new data
                              } catch (err) { alert("Failed to add entry"); }
                            }}
                            className="bg-sky-600 text-white px-6 py-3 rounded-xl font-bold text-xs uppercase hover:bg-sky-700 transition-all flex items-center gap-2 shadow-lg shadow-sky-100 active:scale-95"
                          >
                            <Send size={16} /> Deploy New Entry
                          </button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                          {(adminTab === 'certs' ? dbCertifications : adminTab === 'experience' ? dbExperience : dbProjects).map((item: any, i) => (
                            <div key={i} className={cn("bg-white p-6 rounded-2xl border border-gray-100 space-y-4 hover:shadow-lg transition-all group", item.visible === false && "opacity-50 grayscale")}>
                              <div className="flex justify-between items-start">
                                <div className="w-16 h-16 bg-slate-50 rounded-xl p-2 border border-slate-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                                  <img src={item.logo} alt="" className="max-w-full max-h-full object-contain" />
                                </div>
                                <div className="flex gap-2">
                                  <button 
                                    onClick={async () => {
                                      try {
                                        const coll = adminTab === 'certs' ? 'certifications' : adminTab === 'experience' ? 'experience' : 'projects';
                                        const docRef = doc(db, coll, item.id);
                                        await setDoc(docRef, { visible: item.visible === false }, { merge: true });
                                        window.location.reload();
                                      } catch (err) { console.error(err); }
                                    }}
                                    className={cn("p-2 rounded-lg transition-colors", item.visible === false ? "bg-amber-100 text-amber-600" : "text-slate-300 hover:text-sky-600")}
                                    title={item.visible === false ? "Show Entry" : "Hide Entry"}
                                  >
                                    <X size={18} />
                                  </button>
                                  <button 
                                    onClick={async () => {
                                      if (!confirm("Are you sure you want to delete this?")) return;
                                      try {
                                        const coll = adminTab === 'certs' ? 'certifications' : adminTab === 'experience' ? 'experience' : 'projects';
                                        await deleteDoc(doc(db, coll, item.id));
                                        window.location.reload();
                                      } catch (err) { console.error(err); }
                                    }}
                                    className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                                  >
                                    <Trash2 size={18} />
                                  </button>
                                </div>
                              </div>
                              <div className="space-y-1">
                                <h4 className="font-bold text-slate-900 line-clamp-1 italic">{item.name || item.title || item.company}</h4>
                                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">{item.issuer || item.role || item.category}</p>
                              </div>
                              <div className="flex items-center gap-2 pt-2">
                                <div className="flex-1 h-1 bg-slate-100 rounded-full overflow-hidden">
                                  <div className={cn("h-full", item.visible === false ? "bg-gray-400 w-full" : "bg-sky-500 w-full")} />
                                </div>
                                <span className={cn("text-[9px] font-black px-2 py-0.5 rounded-full uppercase", item.visible === false ? "bg-gray-100 text-gray-500" : "bg-sky-50 text-sky-600")}>
                                  {item.visible === false ? "Hidden" : "Prod"}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
    </ErrorBoundary>
  );
}
