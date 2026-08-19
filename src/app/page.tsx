"use client";
import {
  signInWithPopup,
  onAuthStateChanged,
  signOut,
  User as FirebaseUser,
} from "firebase/auth";
import { auth, googleProvider, db } from "../firebase";
import LoginScreen from "./LoginScreen";
import { doc, getDoc, setDoc } from "firebase/firestore";
import React, { useState, useEffect, ElementType } from "react";
import {
  Calendar,
  Star,
  Swords,
  Store,
  PieChart,
  Dumbbell,
  ShoppingCart,
  Shield,
  Coffee,
  Award,
  BrainCircuit,
  User,
  Plus,
  CheckCircle2,
  UserCircle,
  X,
  AlertOctagon,
  Zap,
  Hourglass,
  Check,
  Coins,
  Sparkles,
  Clock,
  Lock,
  CheckCircle,
  Cpu,
  Ghost,
  Send,
  Target,
  Crown,
  Code,
  Moon,
  Database,
  Trash2,
  Volume2,
  Gift,
} from "lucide-react";

interface Task {
  id: number;
  type: "main" | "side";
  title: string;
  desc: string;
  exp: number;
  coins: number;
  specialCoins: number;
  penaltyDesc: string;
  penaltyExp: number;
  penaltyCoins: number;
  timeLimit: number;
  icon: React.ReactNode;
}

interface SpecialQuest {
  id: number;
  title: string;
  desc: string;
}

type GachaType = "normal" | "super" | "legendary";
interface GachaCard {
  id: number;
  type: GachaType;
  value: number;
}

interface TimerState {
  state: "waiting" | "active" | "success";
  left: number;
}

interface Title {
  id: number;
  name: string;
  enName: string;
  bonusDesc: string;
  requiredLevel: number;
  color: string;
  expBonus: number;
  coinsBonus: number;
  specialBonus: number;
}

interface AvatarData {
  id: number;
  name: string;
  enName: string;
  desc: string;
  color: string;
  icon: ElementType;
  priceCoins: number;
  priceSpecial: number;
}

export default function SoloLevelingSystem() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [activeTab, setActiveTab] = useState("main");

  const [totalExp, setTotalExp] = useState(0);
  const [totalCoins, setTotalCoins] = useState(0);
  const [totalSpecialCoins, setTotalSpecialCoins] = useState(0);
  // معادلة المستوى التراكمية المتصاعدة
  const currentLevel = Math.floor((1 + Math.sqrt(1 + (4 * totalExp) / 50)) / 2);
  const nextLevelExp = 50 * (currentLevel + 1) * currentLevel;

  const [shields, setShields] = useState(0);
  const [mainMultiplier, setMainMultiplier] = useState(1);
  const [sideMultiplier, setSideMultiplier] = useState(1);

  const [bountyHunterCounter, setBountyHunterCounter] = useState(0);
  const [grandmasterCounter, setGrandmasterCounter] = useState(0);
  const [gatekeeperCounter, setGatekeeperCounter] = useState(0);
  const [shadowMonarchLastUsed, setShadowMonarchLastUsed] = useState(0);

  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isCompletingTask, setIsCompletingTask] = useState(false);
  const [oathInput, setOathInput] = useState("");
  const [mainTaskInput, setMainTaskInput] = useState("");
  const [sideTaskInput, setSideTaskInput] = useState("");
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [pendingTask, setPendingTask] = useState<any>(null);

  const [timers, setTimers] = useState<{ main: TimerState; side: TimerState }>({
    main: { state: "waiting", left: 0 },
    side: { state: "waiting", left: 0 },
  });

  const [mainTasks, setMainTasks] = useState<Task[]>([]);
  const [sideTasks, setSideTasks] = useState<Task[]>([]);

  const [specialQuests, setSpecialQuests] = useState<SpecialQuest[]>([]);
  const [specialCountdown, setSpecialCountdown] = useState(0);
  const [selectedSpecialQuest, setSelectedSpecialQuest] =
    useState<SpecialQuest | null>(null);
  const [showSpecialRewardModal, setShowSpecialRewardModal] = useState(false);
  const [specialQuestOath, setSpecialQuestOath] = useState<SpecialQuest | null>(
    null,
  );

  const [gachaCards, setGachaCards] = useState<GachaCard[]>([]);
  const [gachaState, setGachaState] = useState<"selecting" | "revealed">(
    "selecting",
  );
  const [selectedGachaId, setSelectedGachaId] = useState<number | null>(null);
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      if (currentUser) {
        // إذا قام اللاعب بتسجيل الدخول، ابحث عن ملفه السحابي
        const userDocRef = doc(db, "users", currentUser.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          // تفريغ البيانات السحابية داخل متغيرات اللعبة
          const data = userDoc.data();
          setTotalExp(data.totalExp || 0);
          setTotalCoins(data.totalCoins || 0);
          setTotalSpecialCoins(data.totalSpecialCoins || 0);
          if (data.equippedAvatarId) setEquippedAvatarId(data.equippedAvatarId);
          if (data.equippedTitleId) setEquippedTitleId(data.equippedTitleId);
          if (data.unlockedAvatars) setUnlockedAvatars(data.unlockedAvatars);
          showToast("تم مزامنة بياناتك السحابية بنجاح", "buff");
        }
      }

      setIsAuthChecking(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("خطأ في تسجيل الدخول:", error);
    }
  };

  const aiQuestsDatabase = [
    {
      title: "أساسيات الأمن السيبراني",
      desc: "اقرأ عن هندسة الهندسة الاجتماعية (Social Engineering) وكيف يتم اختراق العقول بشرياً، ولخص أهم 3 نقاط.",
    },
    {
      title: "لغة الجسد المتقدمة",
      desc: "شاهد فيديو لمدة 15 دقيقة عن كيفية قراءة تعابير الوجه الدقيقة (Micro-expressions) وردود الأفعال غير الواعية.",
    },
    {
      title: "المتحدث البارع",
      desc: "قف أمام المرآة وتحدث عن مشروع برمجي تعمل عليه لمدة 5 دقائق متواصلة وبصوت واثق كأنك في مقابلة عمل.",
    },
    {
      title: "قوة العادات والتركيز",
      desc: "اكتب 3 عادات يومية صغيرة تسرق وقتك، وضع خطة تقنية (مثل حظر المواقع) لتطبيق 'دوبامين ديتوكس' غداً.",
    },
    {
      title: "فهم سيكولوجية البشر",
      desc: "اقرأ عن مبدأ 'التحيز المعرفي' (Cognitive Bias) وكيف يؤثر على قراراتنا، واذكر موقفاً حدث لك مؤخراً بسببه.",
    },
    {
      title: "الهدوء تحت الضغط",
      desc: "قم بجلسة تأمل وتخيل (Visualization) لتحدي قادم، وركز على إبطاء تنفسك العميق لمدة 10 دقائق.",
    },
    {
      title: "فن التفاوض والإقناع",
      desc: "ابحث عن 3 جمل تكتيكية يمكنك استخدامها لإقناع شخص برأيك دون الدخول في جدال، وسجلها في ملاحظاتك.",
    },
    {
      title: "الذكاء العاطفي (EQ)",
      desc: "راقب محادثة بين شخصين اليوم (أو فيديو حواري)، وحلل المشاعر غير المنطوقة بناءً على نبرة الصوت وحركة اليدين.",
    },
    {
      title: "البرمجة الدفاعية",
      desc: "اقرأ عن ثغرة XSS أو SQL Injection، واكتب كوداً بسيطاً يوضح كيف تحمي أي موقع تبنيه منها.",
    },
    {
      title: "إدارة الوقت الصارمة",
      desc: "طبق تقنية 'بومودورو' اليوم في جلسة دراسة أو برمجة: 25 دقيقة تركيز مطلق، و5 دقائق راحة، لمرتين متتاليتين.",
    },
    {
      title: "هندسة الأسئلة (Prompt Engineering)",
      desc: "جرب صياغة Prompt متقدم ذكي لجيمناي أو ChatGPT ليساعدك في حل مشكلة برمجة معقدة بأسلوب محدد ودقيق.",
    },
    {
      title: "النشاط البدني الخفيف",
      desc: "قم بعمل 20 ضغطة (Push-ups) أو إطالات للجسم سريعة لفك تشنج الرقبة والظهر من جلسة الكمبيوتر.",
    },
    {
      title: "التوقف والتفكر (Mindfulness)",
      desc: "ابتعد عن الشاشات تماماً لمدة 10 دقائق وقم بالتمشي في الهواء الطلق أو الغرفة دون إمساك الهاتف.",
    },
    {
      title: "تعلم أختصارات لوحة المفاتيح",
      desc: "احفظ واستخدم 3 اختصارات جديدة في محرر الأكواد (VS Code) أو محرك البحث لزيادة سرعتك.",
    },
    {
      title: "حل المشكلات المتقدم (Debugging)",
      desc: "اقرأ عن مفهوم البرمجة والتتبع بـ Rubber Duck Debugging واشرح مشكلة برمجية تواجهك لشيء جماد حولك.",
    },
    {
      title: "فن التواصل الجذاب",
      desc: "ابدأ محادثتك مع صديق أو زميل بأسلوب إيجابي مجرياً مجاملة صادقة عن عمل أو ميزة فيه.",
    },
    {
      title: "لغة التواصل اللاعنفي",
      desc: "ابحث عن مبدأ 'التواصل غير العنيف' (Nonviolent Communication)، وجرب صياغة عتاب بأسلوب: (عندما يحدث X، أشعر بـ Y، وأحتاج Z).",
    },
    {
      title: "تأثير انطباع اللقاء الأول",
      desc: "عند التحدث مع شخص اليوم، حافظ على التواصل البصري (Eye Contact) المعتدل والابتسامة الهادئة أثناء الاستماع.",
    },
    {
      title: "حدود العلاقات الصحية",
      desc: "فكر في موقف يضايقك واكتب جملة واحدة واضحة ومهذبة يمكنك استخدامها لقول 'لا' أو وضع حد دون جرح الآخر.",
    },
    {
      title: "تطوير حصيلة الألفاظ",
      desc: "ابحث عن معجم أو مقال، وتعلم كلمتين جديدتين فصيحتين في اللغة (العربية أو الإنجليزية) واستخدمهما في حوارك اليوم.",
    },
    {
      title: "ذكاء السؤال المفتوح",
      desc: "في أي حوار اليوم، اسأل المحاور أسئلة تبدأ بـ 'كيف' أو 'ما رأيك' بدلاً من الأسئلة التي إجابتها 'نعم' أو 'لا'.",
    },
    {
      title: "فهم وجهات النظر (Empathy)",
      desc: "اختر موضوعاً جدلياً تختلف فيه مع شخص ما، واكتب فقرة من 3 أسطر تدافع فيها عن وجهة نظره بنفسك لتقوية التعاطف.",
    },
    {
      title: "قواعد الحوار العقلاني",
      desc: "اقرأ عن مغالطة 'رجل القش' (Straw Man Fallacy) وكيف يتم تشويه ركائز النقاش، واستخرج مثالاً عليها من حوارات مواقع التواصل.",
    },
    {
      title: "التواصل الدافئ والمؤثر",
      desc: "استخدم اسم الشخص أثناء حديثك معه اليوم أكثر من مرة؛ مناداة الشخص باسمه تعزز شعوره بالاهتمام والارتياح تجاهك.",
    },
    {
      title: "فن بناء الانطباع الثابت",
      desc: "لاحظ نبرة صوتك أثناء الحديث اليوم، وتدرب على خفض السرعة والاعتماد على السكتات القصيرة (Pauses) لإعطاء ثقل لكلامك.",
    },
    {
      title: "الوعي بلغة الجسد المفتوحة",
      desc: "تجنب تشبيك ذراعيك أو التحديق في هاتفك أثناء جلوسك مع الآخرين اليوم، واعتمد وضعية جسد مريحة ومرحبة بالحوار.",
    },
    {
      title: "التفكير الناقد في الأخبار",
      desc: "اقرأ خبراً أو تحليلاً وثيق الصلة بمجالك، وحدد هل يعتمد الكاتب على حقائق وأرقام مثبتة أم مجرد آراء وانطباعات شخصية.",
    },
    {
      title: "إدارة الخلاف بنضج",
      desc: "إذا شعرت بالغضب أثناء مناقشة اليوم، انتظر 5 ثوانٍ كاملة قبل الرد، أو استخدم عبارة: 'دعني أفكر في نقطتك وأرد عليك'.",
    },
    {
      title: "بناء الشبكات الشخصية (Networking)",
      desc: "تواصل مع زميل في مجال دراستك أو عملك لم تتحدث معه منذ فترة، واسأله عن جديده ودعمه بتشجيع بسيط.",
    },
    {
      title: "مبدأ رد الجميل المعنوي",
      desc: "إذا شاركك أحد خبرته أو نصحك بشيء واستفدت منه، أرسل له تحديثاً قصيراً تشكره وتخبره بنتيجة تطبيقك لنصيحته.",
    },
  ];

  const [equippedTitleId, setEquippedTitleId] = useState<number>(1);
  const [selectedTitleModal, setSelectedTitleModal] = useState<Title | null>(
    null,
  );
  const [unlockedAvatars, setUnlockedAvatars] = useState<number[]>([1]);
  const [equippedAvatarId, setEquippedAvatarId] = useState<number>(1);
  const [selectedAvatarModal, setSelectedAvatarModal] =
    useState<AvatarData | null>(null);

  const [toastMessage, setToastMessage] = useState<{
    text: string;
    type: "success" | "error" | "buff";
  } | null>(null);

  // --- تحديث جميع الألقاب والنسب حسب طلبك ---
  const titlesList: Title[] = [
    {
      id: 1,
      name: "المبتدئ",
      enName: "Novice",
      bonusDesc: "لا توجد ميزات إضافية.",
      requiredLevel: 1,
      color: "#94a3b8",
      expBonus: 0,
      coinsBonus: 0,
      specialBonus: 0,
    },
    {
      id: 2,
      name: "المستيقظ",
      enName: "Awakened",
      bonusDesc: "زيادة 5% في نقاط الخبرة (EXP).",
      requiredLevel: 3,
      color: "#38bdf8",
      expBonus: 0.05,
      coinsBonus: 0,
      specialBonus: 0,
    },
    {
      id: 3,
      name: "المتدرب المستمر",
      enName: "Relentless Trainee",
      bonusDesc: "زيادة 5% في العملات العادية.",
      requiredLevel: 7,
      color: "#2dd4bf",
      expBonus: 0,
      coinsBonus: 0.05,
      specialBonus: 0,
    },
    {
      id: 4,
      name: "كاسر العادات",
      enName: "Habit Breaker",
      bonusDesc: "زيادة 10% في نقاط الخبرة (EXP).",
      requiredLevel: 10,
      color: "#4ade80",
      expBonus: 0.1,
      coinsBonus: 0,
      specialBonus: 0,
    },
    {
      id: 5,
      name: "المحارب المنضبط",
      enName: "Disciplined Warrior",
      bonusDesc: "زيادة 10% في العملات العادية.",
      requiredLevel: 15,
      color: "#a3e635",
      expBonus: 0,
      coinsBonus: 0.1,
      specialBonus: 0,
    },
    {
      id: 6,
      name: "طالب المعرفة",
      enName: "Seeker of Knowledge",
      bonusDesc: "زيادة 14% في نقاط الخبرة (EXP).",
      requiredLevel: 20,
      color: "#fb923c",
      expBonus: 0.14,
      coinsBonus: 0,
      specialBonus: 0,
    },
    {
      id: 7,
      name: "صياد الأهداف",
      enName: "Goal Hunter",
      bonusDesc: "زيادة 14% في العملات العادية.",
      requiredLevel: 25,
      color: "#f87171",
      expBonus: 0,
      coinsBonus: 0.14,
      specialBonus: 0,
    },
    {
      id: 8,
      name: "المقاتل النخبوي",
      enName: "Elite Fighter",
      bonusDesc: "زيادة 5% في العملات الخاصة.",
      requiredLevel: 30,
      color: "#c084fc",
      expBonus: 0,
      coinsBonus: 0,
      specialBonus: 0.05,
    },
    {
      id: 9,
      name: "العبقري التكتيكي",
      enName: "Tactical Genius",
      bonusDesc: "زيادة 20% في نقاط الخبرة (EXP).",
      requiredLevel: 40,
      color: "#818cf8",
      expBonus: 0.2,
      coinsBonus: 0,
      specialBonus: 0,
    },
    {
      id: 10,
      name: "سيد الظلال",
      enName: "Shadow Master",
      bonusDesc: "زيادة 20% في العملات العادية.",
      requiredLevel: 50,
      color: "#8b5cf6",
      expBonus: 0,
      coinsBonus: 0.2,
      specialBonus: 0,
    },
    {
      id: 11,
      name: "قاهر التحديات",
      enName: "Challenge Conqueror",
      bonusDesc: "زيادة 10% في العملات الخاصة.",
      requiredLevel: 60,
      color: "#f472b6",
      expBonus: 0,
      coinsBonus: 0,
      specialBonus: 0.1,
    },
    {
      id: 12,
      name: "حاكم الوقت",
      enName: "Time Lord",
      bonusDesc: "زيادة 25% في نقاط الخبرة (EXP).",
      requiredLevel: 70,
      color: "#0ea5e9",
      expBonus: 0.25,
      coinsBonus: 0,
      specialBonus: 0,
    },
    {
      id: 13,
      name: "المهندس المعماري لحياته",
      enName: "Architect of Life",
      bonusDesc: "زيادة 25% في العملات العادية.",
      requiredLevel: 80,
      color: "#10b981",
      expBonus: 0,
      coinsBonus: 0.25,
      specialBonus: 0,
    },
    {
      id: 14,
      name: "أسطورة الإنجاز",
      enName: "Legend of Achievement",
      bonusDesc: "زيادة 15% في العملات الخاصة.",
      requiredLevel: 85,
      color: "#f59e0b",
      expBonus: 0,
      coinsBonus: 0,
      specialBonus: 0.15,
    },
    {
      id: 15,
      name: "الوزير",
      enName: "The Vizier",
      bonusDesc: "زيادة 20% EXP و 20% عملات عادية.",
      requiredLevel: 90,
      color: "#d946ef",
      expBonus: 0.2,
      coinsBonus: 0.2,
      specialBonus: 0,
    },
    {
      id: 16,
      name: "نصف ملك سامي",
      enName: "Demigod Sovereign",
      bonusDesc: "زيادة 15% عملات خاصة و 20% EXP.",
      requiredLevel: 95,
      color: "#ef4444",
      expBonus: 0.2,
      coinsBonus: 0,
      specialBonus: 0.15,
    },
    {
      id: 17,
      name: "ملك سامي",
      enName: "The True Sovereign",
      bonusDesc: "زيادة 20% عملات خاصة و 15% عملات عادية.",
      requiredLevel: 100,
      color: "#ffcf00",
      expBonus: 0,
      coinsBonus: 0.15,
      specialBonus: 0.2,
    },
  ];

  const avatarsList: AvatarData[] = [
    {
      id: 1,
      name: "الظل المجهول",
      enName: "The Faceless",
      desc: "لا توجد فائدة. الأفاتار الافتراضي.",
      color: "#64748b",
      icon: User,
      priceCoins: 0,
      priceSpecial: 0,
    },
    {
      id: 2,
      name: "التاجر السري",
      enName: "The Merchant",
      desc: "يفتح المتجر",
      color: "#a855f7",
      icon: Store,
      priceCoins: 100,
      priceSpecial: 0,
    },
    {
      id: 3,
      name: "العقل السيبراني",
      enName: "The Oracle",
      desc: "يفتح التحدث مع الذكاء الاصطناعي.",
      color: "#06b6d4",
      icon: Cpu,
      priceCoins: 500,
      priceSpecial: 50,
    },
    {
      id: 4,
      name: "الموجه الاستراتيجي",
      enName: "The Strategist",
      desc: "يفتح قسم المهام الخاصة (AI Directives).",
      color: "#f59e0b",
      icon: Target,
      priceCoins: 1000,
      priceSpecial: 100,
    },
    {
      id: 5,
      name: "صياد الجوائز",
      enName: "Bounty Hunter",
      desc: "10 عملات خاصة كل 5 مهام رئيسية.",
      color: "#ef4444",
      icon: Swords,
      priceCoins: 1500,
      priceSpecial: 0,
    },
    {
      id: 6,
      name: "سيد الرقعة",
      enName: "The Grandmaster",
      desc: "200 عملة عادية كل 3 مهام فرعية.",
      color: "#eab308",
      icon: Crown,
      priceCoins: 1800,
      priceSpecial: 0,
    },
    {
      id: 7,
      name: "وحش الحديد",
      enName: "Iron Behemoth",
      desc: "إنجاز قبل نصف الوقت يضاعف المكافأة.",
      color: "#f97316",
      icon: Dumbbell,
      priceCoins: 2000,
      priceSpecial: 150,
    },
    {
      id: 8,
      name: "نساج الأكواد",
      enName: "Code Weaver",
      desc: "زيادة 15% في اكتساب العملات الخاصة.",
      color: "#10b981",
      icon: Code,
      priceCoins: 2200,
      priceSpecial: 0,
    },
    {
      id: 9,
      name: "حارس البوابة",
      enName: "The Gatekeeper",
      desc: "يشتري درع كل 10 مهام.",
      color: "#8b5cf6",
      icon: Shield,
      priceCoins: 2500,
      priceSpecial: 200,
    },
    {
      id: 10,
      name: "المخادع",
      enName: "The Trickster",
      desc: "يضاعف وقت تنفيذ المهام الرئيسية.",
      color: "#ec4899",
      icon: Zap,
      priceCoins: 3000,
      priceSpecial: 0,
    },
    {
      id: 11,
      name: "ملك الظلال",
      enName: "The Shadow Monarch",
      desc: "اعطاء مضاعف ثنائي للمهام الرئيسيه والفرعيه كل 72 ساعه.",
      color: "#6366f1",
      icon: Moon,
      priceCoins: 4000,
      priceSpecial: 250,
    },
    {
      id: 12,
      name: "مهندس النظام",
      enName: "System Architect",
      desc: "40% عملات خاصة، 30% عملات عادية زيادة.",
      color: "#14b8a6",
      icon: Database,
      priceCoins: 5000,
      priceSpecial: 300,
    },
  ];

  const getEquippedTitle = () =>
    titlesList.find((t) => t.id === equippedTitleId) || titlesList[0];
  const handleEquipTitle = (id: number) => {
    setEquippedTitleId(id);
    setSelectedTitleModal(null);
  };
  const getEquippedAvatar = () =>
    avatarsList.find((a) => a.id === equippedAvatarId) || avatarsList[0];
  const handleEquipAvatar = (id: number) => {
    setEquippedAvatarId(id);
    setSelectedAvatarModal(null);
  };

  const defaultWelcomeMessage = {
    role: "system" as const,
    text: "أنا النظام. راقب كلماتك قبل أن تطلب التفاوض. الفشل في الإقناع سيعرضك لعواقب وخيمة.",
  };
  const [chatMessages, setChatMessages] = useState<
    { role: "user" | "system"; text: string }[]
  >([defaultWelcomeMessage]);
  const [chatInput, setChatInput] = useState("");
  const [isChatThinking, setIsChatThinking] = useState(false);
  const clearChat = () => setChatMessages([defaultWelcomeMessage]);

  // 1. الاسترجاع السحابي الكامل عند الدخول
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      if (currentUser) {
        const userDocRef = doc(db, "users", currentUser.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          const data = userDoc.data();
          setTotalExp(data.totalExp || 0);
          setTotalCoins(data.totalCoins || 0);
          setTotalSpecialCoins(data.totalSpecialCoins || 0);
          if (data.equippedAvatarId) setEquippedAvatarId(data.equippedAvatarId);
          if (data.equippedTitleId) setEquippedTitleId(data.equippedTitleId);
          if (data.unlockedAvatars) setUnlockedAvatars(data.unlockedAvatars);
          if (data.shields !== undefined) setShields(data.shields);

          // استرجاع المهام الرئيسية وإعادة تعيين الأيقونة
          if (data.mainTasks && Array.isArray(data.mainTasks)) {
            const restoredMain = data.mainTasks.map((t: any) => ({
              ...t,
              icon: <Dumbbell size={35} color="#06b6d4" />,
            }));
            setMainTasks(restoredMain);
          }

          // استرجاع المهام الفرعية وإعادة تعيين الأيقونة
          if (data.sideTasks && Array.isArray(data.sideTasks)) {
            const restoredSide = data.sideTasks.map((t: any) => ({
              ...t,
              icon: <CheckCircle2 size={35} color="#f59e0b" />,
            }));
            setSideTasks(restoredSide);
          }

          // استرجاع حالة العدادات
          if (data.timers) {
            setTimers(data.timers);
          }

          showToast("تم مزامنة بياناتك ومهامك السحابية بنجاح!", "buff");
        }
      }

      setIsAuthChecking(false);
    });
    return () => unsubscribe();
  }, []);

  // 2. نظام الحفظ السحابي التلقائي الشامل
  useEffect(() => {
    if (user && !isAuthChecking) {
      const saveToCloud = async () => {
        try {
          // استخراج المهام بدون حقل الأيقونة لحفظها بنجاح في Firestore
          const cleanMainTasks = mainTasks.map(({ icon, ...rest }) => rest);
          const cleanSideTasks = sideTasks.map(({ icon, ...rest }) => rest);

          const userDocRef = doc(db, "users", user.uid);
          await setDoc(
            userDocRef,
            {
              totalExp,
              totalCoins,
              totalSpecialCoins,
              equippedAvatarId,
              equippedTitleId,
              unlockedAvatars,
              shields,
              mainTasks: cleanMainTasks,
              sideTasks: cleanSideTasks,
              timers,
            },
            { merge: true },
          );
        } catch (error) {
          console.error("خطأ في الحفظ السحابي:", error);
        }
      };

      saveToCloud();
    }
  }, [
    totalExp,
    totalCoins,
    totalSpecialCoins,
    equippedAvatarId,
    equippedTitleId,
    unlockedAvatars,
    shields,
    mainTasks,
    sideTasks,
    timers,
    user,
    isAuthChecking,
  ]);
  const tabs = [
    {
      id: "main",
      name: "المهام الرئيسية",
      icon: (color: string) => <Calendar size={22} color={color} />,
    },
    {
      id: "side",
      name: "المهام الفرعية",
      icon: (color: string) => <Star size={22} color={color} />,
    },
    {
      id: "special",
      name: "المهام الخاصة",
      icon: (color: string) => <Target size={22} color={color} />,
    },
    {
      id: "titles",
      name: "معرض الألقاب",
      icon: (color: string) => <Award size={22} color={color} />,
    },
    {
      id: "avatar",
      name: "الأفاتار",
      icon: (color: string) => <UserCircle size={22} color={color} />,
    },
    {
      id: "shop",
      name: "المتجر",
      icon: (color: string) => <Store size={22} color={color} />,
    },
    {
      id: "ai",
      name: "التحدث مع AI",
      icon: (color: string) => <Cpu size={22} color={color} />,
    },
  ];

  const shopItems = [
    {
      id: "time_1",
      name: "+1 ساعة",
      desc: "إضافة ساعة لعداد المهام",
      price: 200,
      currency: "coins",
      icon: <Hourglass size={30} color="#0ea5e9" />,
    },
    {
      id: "time_3",
      name: "+3 ساعات",
      desc: "إضافة 3 ساعات لعداد المهام",
      price: 500,
      currency: "coins",
      icon: <Hourglass size={30} color="#0ea5e9" />,
    },
    {
      id: "time_5",
      name: "+5 ساعات",
      desc: "إضافة 5 ساعات لعداد المهام",
      price: 900,
      currency: "coins",
      icon: <Hourglass size={30} color="#0ea5e9" />,
    },
    {
      id: "time_7",
      name: "+7 ساعات",
      desc: "إضافة 7 ساعات لعداد المهام",
      price: 1300,
      currency: "coins",
      icon: <Hourglass size={30} color="#0ea5e9" />,
    },
    {
      id: "time_12",
      name: "+12 ساعة",
      desc: "إضافة نصف يوم لعداد المهام",
      price: 1500,
      currency: "coins",
      icon: <Hourglass size={30} color="#0ea5e9" />,
    },
    {
      id: "time_24",
      name: "+24 ساعة",
      desc: "إضافة يوم كامل لعداد المهام",
      price: 2000,
      currency: "coins",
      icon: <Hourglass size={30} color="#0ea5e9" />,
    },
    {
      id: "shield",
      name: "درع الحماية",
      desc: "يحميك من عقوبة انسحاب واحدة.",
      price: 3000,
      currency: "coins",
      icon: <Shield size={30} color="#8b5cf6" />,
    },
    {
      id: "mult_main_2",
      name: "مضاعف رئيسي 2x",
      desc: "يضاعف مكافأة المهمة الرئيسية القادمة.",
      price: 100,
      currency: "specialCoins",
      icon: <Zap size={30} color="#22d3ee" />,
    },
    {
      id: "mult_main_3",
      name: "مضاعف رئيسي 3x",
      desc: "يضاعف مكافأة المهمة الرئيسية القادمة 3 مرات.",
      price: 700,
      currency: "specialCoins",
      icon: <Zap size={30} color="#22d3ee" />,
    },
    {
      id: "mult_side_2",
      name: "مضاعف فرعي 2x",
      desc: "يضاعف مكافأة المهمة الفرعية القادمة.",
      price: 100,
      currency: "specialCoins",
      icon: <Zap size={30} color="#f59e0b" />,
    },
    {
      id: "mult_side_3",
      name: "مضاعف فرعي 3x",
      desc: "يضاعف مكافأة المهمة الفرعية القادمة 3 مرات.",
      price: 700,
      currency: "specialCoins",
      icon: <Zap size={30} color="#f59e0b" />,
    },
  ];

  const playSuccessSound = () => {
    try {
      const audio = new Audio(
        "https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3",
      );
      audio.volume = 0.5;
      audio.play();
    } catch (e) {}
  };

  const showToast = (
    text: string,
    type: "success" | "error" | "buff" = "success",
  ) => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleBuyItem = (item: (typeof shopItems)[0]) => {
    // --- تفعيل قدرة التاجر السري (Avatar 2) 5% خصم ---
    let finalPrice = item.price;
    if (equippedAvatarId === 2) {
      finalPrice = Math.floor(finalPrice * 0.95);
    }

    if (item.currency === "coins") {
      if (totalCoins < finalPrice)
        return showToast(
          `رصيدك من العملات العادية لا يكفي! تحتاج إلى ${finalPrice}`,
          "error",
        );
      setTotalCoins((prev) => prev - finalPrice);
    } else {
      if (totalSpecialCoins < finalPrice)
        return showToast(
          `رصيدك من العملات الخاصة لا يكفي! تحتاج إلى ${finalPrice}`,
          "error",
        );
      setTotalSpecialCoins((prev) => prev - finalPrice);
    }

    if (item.id.startsWith("time_")) {
      const hours = parseInt(item.id.split("_")[1]);
      const seconds = hours * 3600;
      setTimers((prev) => ({
        ...prev,
        main: { ...prev.main, left: prev.main.left + seconds },
        side: { ...prev.side, left: prev.side.left + seconds },
      }));
      showToast(`تمت إضافة ${hours} ساعة لعداداتك!`, "buff");
    } else if (item.id === "shield") {
      setShields((prev) => prev + 1);
      showToast(`تم تفعيل درع الحماية!`, "buff");
    } else if (item.id === "mult_main_2") {
      setMainMultiplier(2);
      showToast(`تم تفعيل المضاعف الرئيسي 2x!`, "buff");
    } else if (item.id === "mult_main_3") {
      setMainMultiplier(3);
      showToast(`تم تفعيل المضاعف الرئيسي 3x!`, "buff");
    } else if (item.id === "mult_side_2") {
      setSideMultiplier(2);
      showToast(`تم تفعيل المضاعف الفرعي 2x!`, "buff");
    } else if (item.id === "mult_side_3") {
      setSideMultiplier(3);
      showToast(`تم تفعيل المضاعف الفرعي 3x!`, "buff");
    }
    playSuccessSound();
  };

  useEffect(() => {
    if (
      timers.main.state === "active" &&
      timers.main.left === 0 &&
      mainTasks.length > 0
    ) {
      if (shields > 0) {
        setShields((prev) => prev - 1);
        showToast("نفذ الوقت! تم استهلاك درع حماية وأنقذك من العقوبة.", "buff");
      } else {
        let pExp = 0,
          pCoins = 0;
        mainTasks.forEach((t) => {
          pExp += t.penaltyExp;
          pCoins += t.penaltyCoins;
        });
        setTotalExp((prev) => Math.max(0, prev - pExp));
        setTotalCoins((prev) => Math.max(0, prev - pCoins));
        showToast(
          `نفذ الوقت! تم فشل المهام وخصم ${pExp} EXP و ${pCoins} عملة كعقوبة.`,
          "error",
        );
      }
      setMainTasks([]);
      setTimers((prev) => ({ ...prev, main: { state: "waiting", left: 0 } }));
      setSelectedTask(null);
      setIsCompletingTask(false);
      setOathInput("");
    }

    if (
      timers.side.state === "active" &&
      timers.side.left === 0 &&
      sideTasks.length > 0
    ) {
      if (shields > 0) {
        setShields((prev) => prev - 1);
        showToast("نفذ الوقت! تم استهلاك درع حماية وأنقذك من العقوبة.", "buff");
      } else {
        let pExp = 0,
          pCoins = 0;
        sideTasks.forEach((t) => {
          pExp += t.penaltyExp;
          pCoins += t.penaltyCoins;
        });
        setTotalExp((prev) => Math.max(0, prev - pExp));
        setTotalCoins((prev) => Math.max(0, prev - pCoins));
        showToast(
          `نفذ الوقت! تم فشل المهام وخصم ${pExp} EXP و ${pCoins} عملة كعقوبة.`,
          "error",
        );
      }
      setSideTasks([]);
      setTimers((prev) => ({ ...prev, side: { state: "waiting", left: 0 } }));
      setSelectedTask(null);
      setIsCompletingTask(false);
      setOathInput("");
    }
  }, [timers.main.left, timers.side.left]);

  useEffect(() => {
    if (mainTasks.length === 0 && timers.main.state === "active")
      setTimers((prev) => ({ ...prev, main: { state: "success", left: 0 } }));
    if (sideTasks.length === 0 && timers.side.state === "active")
      setTimers((prev) => ({ ...prev, side: { state: "success", left: 0 } }));
  }, [
    mainTasks.length,
    timers.main.state,
    sideTasks.length,
    timers.side.state,
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimers((prev) => ({
        main:
          prev.main.state === "active"
            ? {
                ...prev.main,
                left: prev.main.left > 0 ? prev.main.left - 1 : 0,
              }
            : prev.main,
        side:
          prev.side.state === "active"
            ? {
                ...prev.side,
                left: prev.side.left > 0 ? prev.side.left - 1 : 0,
              }
            : prev.side,
      }));
      setSpecialCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600)
      .toString()
      .padStart(2, "0");
    const m = Math.floor((seconds % 3600) / 60)
      .toString()
      .padStart(2, "0");
    const s = Math.floor(seconds % 60)
      .toString()
      .padStart(2, "0");
    return `${h}:${m}:${s}`;
  };

  const handleAddClick = async (type: "main" | "side") => {
    const input = type === "main" ? mainTaskInput : sideTaskInput;
    if (input.trim() === "") return;
    setIsAiThinking(true);
    try {
      const res = await fetch("/api/analyzeTask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskName: input, taskType: type }),
      });
      if (!res.ok) throw new Error("System API Error");
      const aiResponse = await res.json();

      setPendingTask({
        type,
        title: aiResponse.title || "مهمة جديدة",
        desc: aiResponse.description || "لا يوجد وصف من النظام.",
        exp: aiResponse.exp || 10,
        coins: aiResponse.coins || 5,
        specialCoins: aiResponse.specialCoins || 0,
        penaltyDesc: aiResponse.penaltyDesc || "عقوبة غير محددة",
        penaltyExp: aiResponse.penaltyExp || 5,
        penaltyCoins: aiResponse.penaltyCoins || 5,
        estimatedHours: aiResponse.estimatedHours || 0,
        estimatedMinutes: aiResponse.estimatedMinutes || 30,
      });
      setShowConfirmModal(true);
    } catch (error) {
      alert("تعطل النظام. تأكد من عمل السيرفر.");
    } finally {
      setIsAiThinking(false);
    }
  };

  const confirmAddTask = () => {
    if (pendingTask) {
      let totalSeconds =
        pendingTask.estimatedHours * 3600 + pendingTask.estimatedMinutes * 60;

      // --- تفعيل قدرة المخادع (Avatar 10) يضاعف وقت المهام الرئيسية ---
      let tricksterTriggered = false;
      if (equippedAvatarId === 10 && pendingTask.type === "main") {
        totalSeconds *= 2;
        tricksterTriggered = true;
      }

      const shortId = Math.floor(Math.random() * 900) + 100;
      const newTask: Task = {
        id: shortId,
        type: pendingTask.type,
        title: pendingTask.title,
        desc: pendingTask.desc,
        exp: pendingTask.exp,
        coins: pendingTask.coins,
        specialCoins: pendingTask.specialCoins,
        penaltyDesc: pendingTask.penaltyDesc,
        penaltyExp: pendingTask.penaltyExp,
        penaltyCoins: pendingTask.penaltyCoins,
        timeLimit: totalSeconds,
        icon:
          pendingTask.type === "main" ? (
            <Dumbbell size={35} color="#06b6d4" />
          ) : (
            <CheckCircle2 size={35} color="#f59e0b" />
          ),
      };
      if (pendingTask.type === "main") {
        setMainTasks([newTask, ...mainTasks]);
        setMainTaskInput("");
        setTimers((prev) => ({
          ...prev,
          main: {
            state: "active",
            left:
              prev.main.state === "active"
                ? prev.main.left + totalSeconds
                : totalSeconds,
          },
        }));
      } else {
        setSideTasks([newTask, ...sideTasks]);
        setSideTaskInput("");
        setTimers((prev) => ({
          ...prev,
          side: {
            state: "active",
            left:
              prev.side.state === "active"
                ? prev.side.left + totalSeconds
                : totalSeconds,
          },
        }));
      }

      if (tricksterTriggered) {
        showToast(`قدرة المخادع: تم مضاعفة وقت المهمة الرئيسية!`, "buff");
      }

      setPendingTask(null);
      setShowConfirmModal(false);
    }
  };

  const cancelAddTask = () => {
    setPendingTask(null);
    setShowConfirmModal(false);
  };

  const handleSendChatMessage = async () => {
    if (!chatInput.trim()) return;
    const userMsg = chatInput;
    setChatMessages((prev) => [...prev, { role: "user", text: userMsg }]);
    setChatInput("");
    setIsChatThinking(true);

    try {
      const safeMainTasks = mainTasks.map(({ icon, ...rest }) => rest);
      const safeSideTasks = sideTasks.map(({ icon, ...rest }) => rest);

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMsg,
          mainTasks: safeMainTasks,
          sideTasks: safeSideTasks,
        }),
      });

      if (!res.ok) throw new Error();
      const data = await res.json();
      setChatMessages((prev) => [
        ...prev,
        { role: "system", text: data.reply },
      ]);

      if (data.hasAction && data.actionDetails) {
        const {
          taskId,
          taskType,
          addExp,
          addCoins,
          addSpecialCoins,
          addTimeSeconds,
          addPenaltyExp,
          addPenaltyCoins,
        } = data.actionDetails;

        if (taskType === "main") {
          setMainTasks((prev) =>
            prev.map((t) =>
              t.id === taskId
                ? {
                    ...t,
                    exp: Math.max(0, t.exp + (addExp || 0)),
                    coins: Math.max(0, t.coins + (addCoins || 0)),
                    specialCoins: Math.max(
                      0,
                      t.specialCoins + (addSpecialCoins || 0),
                    ),
                    penaltyExp: Math.max(
                      0,
                      t.penaltyExp + (addPenaltyExp || 0),
                    ),
                    penaltyCoins: Math.max(
                      0,
                      t.penaltyCoins + (addPenaltyCoins || 0),
                    ),
                    timeLimit: Math.max(0, t.timeLimit + (addTimeSeconds || 0)),
                  }
                : t,
            ),
          );

          if (addTimeSeconds)
            setTimers((prev) => ({
              ...prev,
              main: {
                ...prev.main,
                left: Math.max(0, prev.main.left + addTimeSeconds),
              },
            }));

          setSelectedTask((prev) => {
            if (prev && prev.id === taskId) {
              return {
                ...prev,
                exp: Math.max(0, prev.exp + (addExp || 0)),
                coins: Math.max(0, prev.coins + (addCoins || 0)),
                specialCoins: Math.max(
                  0,
                  prev.specialCoins + (addSpecialCoins || 0),
                ),
                penaltyExp: Math.max(0, prev.penaltyExp + (addPenaltyExp || 0)),
                penaltyCoins: Math.max(
                  0,
                  prev.penaltyCoins + (addPenaltyCoins || 0),
                ),
                timeLimit: Math.max(0, prev.timeLimit + (addTimeSeconds || 0)),
              };
            }
            return prev;
          });
        } else if (taskType === "side") {
          setSideTasks((prev) =>
            prev.map((t) =>
              t.id === taskId
                ? {
                    ...t,
                    exp: Math.max(0, t.exp + (addExp || 0)),
                    coins: Math.max(0, t.coins + (addCoins || 0)),
                    specialCoins: Math.max(
                      0,
                      t.specialCoins + (addSpecialCoins || 0),
                    ),
                    penaltyExp: Math.max(
                      0,
                      t.penaltyExp + (addPenaltyExp || 0),
                    ),
                    penaltyCoins: Math.max(
                      0,
                      t.penaltyCoins + (addPenaltyCoins || 0),
                    ),
                    timeLimit: Math.max(0, t.timeLimit + (addTimeSeconds || 0)),
                  }
                : t,
            ),
          );

          if (addTimeSeconds)
            setTimers((prev) => ({
              ...prev,
              side: {
                ...prev.side,
                left: Math.max(0, prev.side.left + addTimeSeconds),
              },
            }));

          setSelectedTask((prev) => {
            if (prev && prev.id === taskId) {
              return {
                ...prev,
                exp: Math.max(0, prev.exp + (addExp || 0)),
                coins: Math.max(0, prev.coins + (addCoins || 0)),
                specialCoins: Math.max(
                  0,
                  prev.specialCoins + (addSpecialCoins || 0),
                ),
                penaltyExp: Math.max(0, prev.penaltyExp + (addPenaltyExp || 0)),
                penaltyCoins: Math.max(
                  0,
                  prev.penaltyCoins + (addPenaltyCoins || 0),
                ),
                timeLimit: Math.max(0, prev.timeLimit + (addTimeSeconds || 0)),
              };
            }
            return prev;
          });
        }
      }
    } catch (error) {
      setChatMessages((prev) => [
        ...prev,
        { role: "system", text: "فشل الاتصال بعقل النظام." },
      ]);
    } finally {
      setIsChatThinking(false);
    }
  };

  const closeTaskModal = () => {
    setSelectedTask(null);
    setIsCompletingTask(false);
    setOathInput("");
  };

  const handleWithdrawTask = () => {
    if (selectedTask) {
      if (shields > 0) {
        setShields((prev) => prev - 1);
        showToast(
          `تم تدمير درع حماية! تم إلغاء المهمة بدون أي عقوبات.`,
          "buff",
        );
      } else {
        setTotalExp((prev) => Math.max(0, prev - selectedTask.penaltyExp));
        setTotalCoins((prev) => Math.max(0, prev - selectedTask.penaltyCoins));
        showToast(`تم الانسحاب وخصم ${selectedTask.penaltyExp} EXP.`, "error");
      }
      if (selectedTask.type === "main")
        setMainTasks((prev) => prev.filter((t) => t.id !== selectedTask.id));
      else setSideTasks((prev) => prev.filter((t) => t.id !== selectedTask.id));
    }
    closeTaskModal();
  };

  const handleVerifyOath = () => {
    const requiredOath = "اقسم اني انهيت المهمه بنجاح ولا اكذب اقسم بالله";
    if (oathInput.trim().replace(/\s+/g, " ") === requiredOath) {
      if (selectedTask) {
        let multi = 1;
        if (selectedTask.type === "main" && mainMultiplier > 1) {
          multi = mainMultiplier;
          setMainMultiplier(1);
          showToast(`تم تطبيق المضاعف الرئيسي ${multi}x!`, "buff");
        } else if (selectedTask.type === "side" && sideMultiplier > 1) {
          multi = sideMultiplier;
          setSideMultiplier(1);
          showToast(`تم تطبيق المضاعف الفرعي ${multi}x!`, "buff");
        }

        // --- تفعيل قدرة وحش الحديد (Avatar 7) 2x إنجاز مبكر ---
        let ironBehemothTriggered = false;
        if (equippedAvatarId === 7) {
          const timeLeft =
            selectedTask.type === "main" ? timers.main.left : timers.side.left;
          if (timeLeft >= selectedTask.timeLimit / 2) {
            multi *= 2;
            ironBehemothTriggered = true;
          }
        }

        const currentTitle = getEquippedTitle();
        const bonusExp = Math.round(selectedTask.exp * currentTitle.expBonus);
        const bonusCoins = Math.round(
          selectedTask.coins * currentTitle.coinsBonus,
        );
        const bonusSpecial =
          currentTitle.specialBonus > 0 && selectedTask.specialCoins > 0
            ? Math.max(
                1,
                Math.round(
                  selectedTask.specialCoins * currentTitle.specialBonus,
                ),
              )
            : 0;

        let avatarBonusCoins = 0;
        let avatarBonusSpecial = 0;

        if (equippedAvatarId === 8) {
          // نساج الأكواد
          avatarBonusSpecial = Math.round(selectedTask.specialCoins * 0.15);
        } else if (equippedAvatarId === 12) {
          // مهندس النظام
          avatarBonusCoins = Math.round(selectedTask.coins * 0.3);
          avatarBonusSpecial = Math.round(selectedTask.specialCoins * 0.4);
        }

        const finalExp = selectedTask.exp * multi + bonusExp;
        const finalCoins =
          selectedTask.coins * multi + bonusCoins + avatarBonusCoins;
        const finalSpecial =
          selectedTask.specialCoins * multi + bonusSpecial + avatarBonusSpecial;

        setTotalExp((prev) => prev + finalExp);
        setTotalCoins((prev) => prev + finalCoins);
        setTotalSpecialCoins((prev) => prev + finalSpecial);

        // --- تأثيرات الأفاتار التراكمية (Counters) ---
        if (equippedAvatarId === 5 && selectedTask.type === "main") {
          // صياد الجوائز
          const newCount = bountyHunterCounter + 1;
          setBountyHunterCounter(newCount);
          if (newCount % 5 === 0) {
            setTotalSpecialCoins((prev) => prev + 10);
            setTimeout(
              () =>
                showToast(`قدرة صياد الجوائز: حصلت على 10 عملات خاصة!`, "buff"),
              4500,
            );
          }
        }

        if (equippedAvatarId === 6 && selectedTask.type === "side") {
          // سيد الرقعة
          const newCount = grandmasterCounter + 1;
          setGrandmasterCounter(newCount);
          if (newCount % 3 === 0) {
            setTotalCoins((prev) => prev + 200);
            setTimeout(
              () =>
                showToast(`قدرة سيد الرقعة: حصلت على 200 عملة عادية!`, "buff"),
              4500,
            );
          }
        }

        if (equippedAvatarId === 9) {
          // حارس البوابة
          const newCount = gatekeeperCounter + 1;
          setGatekeeperCounter(newCount);
          if (newCount % 10 === 0) {
            setShields((prev) => prev + 1);
            setTimeout(
              () =>
                showToast(
                  `قدرة حارس البوابة: حصلت على درع حماية مجاني!`,
                  "buff",
                ),
              4500,
            );
          }
        }

        if (selectedTask.type === "main")
          setMainTasks((prev) => prev.filter((t) => t.id !== selectedTask.id));
        else
          setSideTasks((prev) => prev.filter((t) => t.id !== selectedTask.id));

        playSuccessSound();
        setTimeout(
          () =>
            showToast(
              `اكتسبت ${finalExp - bonusExp} EXP و ${finalCoins - bonusCoins - avatarBonusCoins} عملة أساسية!`,
            ),
          multi > 1 ? 2000 : 0,
        );

        let titleBonusMsg = [];
        if (bonusExp > 0) titleBonusMsg.push(`+${bonusExp} EXP`);
        if (bonusCoins > 0) titleBonusMsg.push(`+${bonusCoins} عملة`);
        if (bonusSpecial > 0) titleBonusMsg.push(`+${bonusSpecial} عملة خاصة`);
        if (titleBonusMsg.length > 0) {
          setTimeout(
            () =>
              showToast(
                `تأثير "${currentTitle.name}": حصلت على ${titleBonusMsg.join(" و ")} إضافية!`,
                "buff",
              ),
            multi > 1 ? 4000 : 2000,
          );
        }

        let avatarMsg = [];
        if (ironBehemothTriggered) avatarMsg.push(`مضاعف وحش الحديد 2x للسرعة`);
        if (avatarBonusCoins > 0) avatarMsg.push(`+${avatarBonusCoins} عملة`);
        if (avatarBonusSpecial > 0)
          avatarMsg.push(`+${avatarBonusSpecial} عملة خاصة`);
        if (avatarMsg.length > 0) {
          setTimeout(
            () =>
              showToast(
                `تأثير الأفاتار المجهز: ${avatarMsg.join(" و ")}!`,
                "buff",
              ),
            multi > 1 ? 6000 : 4000,
          );
        }
      }
      closeTaskModal();
    } else {
      showToast("القسم غير صحيح! تأكد من كتابته بدقة تامة.", "error");
    }
  };

  const generateSpecialQuests = () => {
    const numQuests = Math.floor(Math.random() * 3) + 1;
    const shuffled = [...aiQuestsDatabase].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, numQuests).map((q, index) => ({
      id: Date.now() + index,
      title: q.title,
      desc: q.desc,
    }));
    setSpecialQuests(selected);

    const randomHours = Math.floor(Math.random() * 90) + 10;
    setSpecialCountdown(randomHours * 3600);
    showToast(`اكتشف النظام ${numQuests} مهام خاصة جديدة!`, "buff");
  };

  const handleVerifySpecialOath = () => {
    const requiredOath = "اقسم اني انهيت المهمه بنجاح ولا اكذب اقسم بالله";
    if (oathInput.trim().replace(/\s+/g, " ") === requiredOath) {
      if (specialQuestOath) {
        const types: GachaType[] = ["normal", "super", "legendary"];
        const shuffledTypes = types.sort(() => Math.random() - 0.5);

        const cards: GachaCard[] = shuffledTypes.map((type, idx) => {
          let val = 0;
          // قيم الجوائز لكل نوع بعد التعديل الجديد
          if (type === "normal")
            val = Math.floor(Math.random() * (5000 - 500 + 1)) + 500;
          if (type === "super")
            val = Math.floor(Math.random() * (500 - 50 + 1)) + 50;
          if (type === "legendary")
            val = Math.floor(Math.random() * (300 - 30 + 1)) + 30;
          return { id: idx, type, value: val };
        });

        setGachaCards(cards);
        setGachaState("selecting");
        setSelectedGachaId(null);
        setSelectedSpecialQuest(specialQuestOath);
        setShowSpecialRewardModal(true);
      }
      setSpecialQuestOath(null);
      setOathInput("");
    } else {
      showToast("القسم غير صحيح! تأكد من كتابته بدقة تامة.", "error");
    }
  };

  const claimGachaReward = (cardId: number) => {
    if (gachaState === "revealed") return;

    setGachaState("revealed");
    setSelectedGachaId(cardId);

    const selectedCard = gachaCards.find((c) => c.id === cardId);
    if (selectedCard) {
      if (selectedCard.type === "normal") {
        setTotalExp((prev) => prev + selectedCard.value);
        showToast(
          `جائزة عادية: حصلت على ${selectedCard.value} نقطة خبرة (EXP)!`,
          "success",
        );
      } else if (selectedCard.type === "super") {
        setTotalCoins((prev) => prev + selectedCard.value);
        showToast(`جائزة خارقة: حصلت على ${selectedCard.value} عملة!`, "buff");
      } else if (selectedCard.type === "legendary") {
        setTotalSpecialCoins((prev) => prev + selectedCard.value);
        showToast(
          `جائزة أسطورية: حصلت على ${selectedCard.value} عملات خاصة!`,
          "success",
        );
      }
      playSuccessSound();
    }

    setTimeout(() => {
      setSpecialQuests((prev) =>
        prev.filter((q) => q.id !== selectedSpecialQuest?.id),
      );
      setShowSpecialRewardModal(false);
      setSelectedSpecialQuest(null);
    }, 4000);
  };

  // --- التحقق من قدرة ملك الظلال للظهور في القائمة الجانبية ---
  // --- التحقق من قدرة ملك الظلال للظهور في القائمة الجانبية (72 ساعة) ---
  const isShadowMonarchReady =
    equippedAvatarId === 11 &&
    Date.now() - shadowMonarchLastUsed >= 72 * 60 * 60 * 1000;
  if (isAuthChecking) {
    return (
      <div
        style={{
          minHeight: "100vh",
          backgroundColor: "#0f172a",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          color: "#38bdf8",
          fontSize: "24px",
          fontWeight: "bold",
        }}
      >
        جاري التحقق من الهوية...
      </div>
    );
  }

  if (!user) {
    return <LoginScreen onLogin={handleLogin} />;
  }
  return (
    <>
      <style>{`
        @keyframes pulse { 0% { transform: scale(1); } 50% { transform: scale(1.02); } 100% { transform: scale(1); } }
        @keyframes rainbowGlow { 0% { color: #ff0000; text-shadow: 0 0 15px #ff0000; } 17% { color: #ff8000; text-shadow: 0 0 15px #ff8000; } 33% { color: #ffff00; text-shadow: 0 0 15px #ffff00; } 50% { color: #00ff00; text-shadow: 0 0 15px #00ff00; } 67% { color: #0000ff; text-shadow: 0 0 15px #0000ff; } 83% { color: #8000ff; text-shadow: 0 0 15px #8000ff; } 100% { color: #ff0000; text-shadow: 0 0 15px #ff0000; } }
        .youssef-name { animation: rainbowGlow 4s linear infinite; font-family: monospace; font-weight: 900; font-size: 34px; letter-spacing: 6px; text-align: center; margin-bottom: 20px; direction: ltr; }
        .exp-box { background-color: #05070a; border: 1px solid #083344; border-radius: 15px; padding: 25px 15px; margin-bottom: 15px; display: flex; flex-direction: column; align-items: center; box-shadow: 0 0 15px rgba(2, 132, 199, 0.2); }
        .exp-title { font-size: 16px; color: #38bdf8; font-weight: bold; letter-spacing: 4px; margin-bottom: 10px; }
        .exp-number { font-size: 55px; font-weight: 900; color: #ffffff; text-shadow: 0 0 20px rgba(14,165,233,1), 0 0 40px rgba(2,132,199,0.8); transition: all 0.5s ease;}
        .currency-box { display: flex; justify-content: space-between; align-items: center; background-color: #0f172a; padding: 12px 15px; border-radius: 10px; margin-bottom: 12px; }
        .currency-primary { border: 1px solid #eab308; box-shadow: 0 0 12px rgba(234,179,8,0.25); transition: all 0.5s ease;}
        .currency-special { border: 1px solid #10b981; box-shadow: 0 0 12px rgba(16,185,129,0.25); transition: all 0.5s ease;}
        .active-buffs { background-color: #082f49; border: 1px solid #0284c7; border-radius: 10px; padding: 12px; margin-bottom: 15px; box-shadow: 0 0 15px rgba(14,165,233,0.2); }
        .task-input:focus { box-shadow: 0 0 15px rgba(14, 165, 233, 0.4); border-color: #0ea5e9 !important; }
        .task-card { display: flex; align-items: center; gap: 20px; background-color: #0a0d14; border: 1px solid #1e293b; padding: 20px; border-radius: 15px; cursor: pointer; transition: all 0.2s ease; }
        .task-card.main:hover { border-color: #06b6d4; box-shadow: 0 0 20px rgba(6,182,212,0.2); transform: translateY(-2px); }
        .task-card.side:hover { border-color: #f59e0b; box-shadow: 0 0 20px rgba(245,158,11,0.2); transform: translateY(-2px); }
        .task-card.special-quest:hover { border-color: #f59e0b; box-shadow: 0 0 20px rgba(245,158,11,0.2); transform: translateY(-2px); }
        .modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.85); backdrop-filter: blur(8px); display: flex; justify-content: center; align-items: center; z-index: 100; }
        .modal-content { background: #0a0d14; border: 1px solid #1e293b; border-radius: 24px; width: 650px; max-width: 95%; padding: 35px; box-shadow: 0 20px 50px rgba(0,0,0,0.8); position: relative; animation: slideUp 0.3s ease-out forwards; }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .timer-container { padding: 20px; border-radius: 15px; margin-bottom: 25px; text-align: center; border: 1px solid; display: flex; flex-direction: column; align-items: center; justify-content: center; transition: all 0.3s ease; }
        .timer-waiting { background: #0a0a0a; border-color: #334155; color: #cbd5e1; }
        .timer-active { background: #1a0505; border-color: #ef4444; color: #ef4444; box-shadow: 0 0 20px rgba(239,68,68,0.25); }
        .timer-success { background: #051a05; border-color: #22c55e; color: #22c55e; box-shadow: 0 0 20px rgba(34,197,94,0.25); }
        .timer-text { font-family: monospace; font-size: 38px; font-weight: bold; letter-spacing: 4px; margin-top: 5px; }
        .card-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 20px; }
        .item-card { background-color: #0a0d14; border: 1px solid; border-radius: 15px; padding: 20px; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; transition: all 0.3s ease; position: relative; overflow: hidden; cursor: pointer; height: 160px; }
        .item-card:hover { transform: translateY(-5px); box-shadow: 0 10px 20px rgba(0,0,0,0.5); }
        .item-card.equipped { background-color: #0f172a; }
        .chat-container { display: flex; flex-direction: column; height: 600px; background: #0a0d14; border: 1px solid #083344; border-radius: 15px; overflow: hidden; position: relative; }
        .chat-messages { flex: 1; overflow-y: auto; padding: 20px; display: flex; flex-direction: column; gap: 15px; }
        .msg-bubble { max-width: 80%; padding: 15px 20px; border-radius: 15px; font-size: 16px; line-height: 1.6; }
        .msg-system { background: #083344; color: #22d3ee; align-self: flex-start; border-bottom-right-radius: 0; border: 1px solid #06b6d4; }
        .msg-user { background: #1e293b; color: #f8fafc; align-self: flex-end; border-bottom-left-radius: 0; border: 1px solid #334155; }
        .chat-input-area { display: flex; gap: 10px; padding: 15px; background: #0f172a; border-top: 1px solid #083344; }
        .toast-notification { position: fixed; bottom: 30px; left: 50%; transform: translateX(-50%); padding: 15px 30px; border-radius: 50px; font-weight: bold; font-size: 16px; z-index: 9999; display: flex; align-items: center; gap: 10px; animation: slideUpToast 0.5s ease forwards; }
        .toast-success { background: #06b6d4; color: white; box-shadow: 0 10px 30px rgba(6, 182, 212, 0.4); border: 2px solid #22d3ee; }
        .toast-error { background: #ef4444; color: white; box-shadow: 0 10px 30px rgba(239, 68, 68, 0.4); border: 2px solid #f87171; }
        .toast-buff { background: #8b5cf6; color: white; box-shadow: 0 10px 30px rgba(139, 92, 246, 0.4); border: 2px solid #c084fc; }
        @keyframes slideUpToast { from { bottom: -50px; opacity: 0; } to { bottom: 30px; opacity: 1; } }
        
        .gacha-card { flex: 1; height: 220px; display: flex; flex-direction: column; align-items: center; justify-content: center; border-radius: 15px; cursor: pointer; transition: all 0.3s ease; border: 2px solid; }
        .gacha-mystery { background: #0f172a; border-color: #334155; color: #94a3b8; }
        .gacha-mystery:hover { border-color: #0ea5e9; box-shadow: 0 0 20px rgba(14, 165, 233, 0.3); transform: translateY(-5px); }
        .gacha-white { background: #1e293b; border-color: #e2e8f0; color: #e2e8f0; box-shadow: 0 0 20px rgba(226,232,240,0.2); }
        .gacha-purple { background: #3b0764; border-color: #a855f7; color: #d8b4fe; box-shadow: 0 0 20px rgba(168,85,247,0.4); }
        .gacha-yellow { background: #422006; border-color: #eab308; color: #fde047; box-shadow: 0 0 30px rgba(234,179,8,0.5); }
      `}</style>

      {toastMessage && (
        <div
          className={`toast-notification toast-${toastMessage.type}`}
          dir="rtl"
        >
          {toastMessage.type === "success" && <Award size={24} />}
          {toastMessage.type === "error" && <AlertOctagon size={24} />}
          {toastMessage.type === "buff" && <Zap size={24} />}
          {toastMessage.text}
        </div>
      )}

      {specialQuestOath && (
        <div
          className="modal-overlay"
          onClick={() => {
            setSpecialQuestOath(null);
            setOathInput("");
          }}
        >
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            dir="rtl"
          >
            <button
              onClick={() => {
                setSpecialQuestOath(null);
                setOathInput("");
              }}
              style={{
                position: "absolute",
                top: "20px",
                left: "20px",
                background: "transparent",
                border: "none",
                color: "#64748b",
                cursor: "pointer",
              }}
            >
              <X size={28} className="hover:text-white transition-colors" />
            </button>

            <div
              style={{
                padding: "20px",
                backgroundColor: "#0f172a",
                borderRadius: "15px",
                border: "1px solid #f59e0b",
                textAlign: "center",
              }}
            >
              <Target
                size={50}
                color="#f59e0b"
                style={{ margin: "0 auto 15px auto" }}
              />
              <h2
                style={{
                  fontSize: "24px",
                  fontWeight: "900",
                  color: "#fff",
                  marginBottom: "15px",
                }}
              >
                تأكيد إنجاز المهمة الخاصة
              </h2>
              <h4
                style={{
                  color: "#fff",
                  fontSize: "20px",
                  marginBottom: "10px",
                }}
              >
                أقسم بشرفك أولاً:
              </h4>
              <p
                style={{
                  color: "#94a3b8",
                  fontSize: "15px",
                  marginBottom: "15px",
                }}
              >
                اكتب العبارة التالية بدقة تامة لتفعيل الجائزة الكبرى:
                <br />
                <strong
                  style={{
                    color: "#f59e0b",
                    fontSize: "18px",
                    display: "block",
                    marginTop: "5px",
                    userSelect: "none",
                    WebkitUserSelect: "none",
                  }}
                  onCopy={(e) => {
                    e.preventDefault();
                    showToast("النظام يراقبك: ممنوع النسخ!", "error");
                  }}
                  onContextMenu={(e) => e.preventDefault()}
                >
                  اقسم اني انهيت المهمه بنجاح ولا اكذب اقسم بالله
                </strong>
              </p>
              <input
                type="text"
                value={oathInput}
                onChange={(e) => setOathInput(e.target.value)}
                onPaste={(e) => {
                  e.preventDefault();
                  showToast(
                    "النظام يرفض اللصق! يجب أن تكتب القسم بيدك.",
                    "error",
                  );
                }}
                onDrop={(e) => e.preventDefault()}
                autoComplete="off"
                placeholder="اكتب القسم هنا حرفاً بحرف..."
                dir="rtl"
                style={{
                  width: "90%",
                  display: "block",
                  margin: "0 auto 15px auto",
                  backgroundColor: "#1e293b",
                  border: "1px solid #334155",
                  borderRadius: "8px",
                  padding: "10px",
                  color: "white",
                  fontSize: "15px",
                  outline: "none",
                  textAlign: "center",
                }}
              />
              <button
                onClick={handleVerifySpecialOath}
                style={{
                  width: "90%",
                  margin: "0 auto",
                  display: "block",
                  padding: "12px",
                  backgroundColor: "#f59e0b",
                  color: "white",
                  border: "none",
                  borderRadius: "12px",
                  fontSize: "16px",
                  fontWeight: "bold",
                  cursor: "pointer",
                  boxShadow: "0 0 15px rgba(245,158,11,0.4)",
                }}
              >
                تأكيد القسم وسحب الغنيمة
              </button>
            </div>
          </div>
        </div>
      )}

      {showSpecialRewardModal && selectedSpecialQuest && (
        <div className="modal-overlay" style={{ zIndex: 1000 }}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            dir="rtl"
            style={{
              textAlign: "center",
              width: "800px",
              border: "2px solid #f59e0b",
              boxShadow: "0 0 50px rgba(245,158,11,0.3)",
            }}
          >
            <h2
              style={{
                fontSize: "32px",
                fontWeight: "900",
                color: "#fbbf24",
                textShadow: "0 0 15px rgba(251,191,36,0.5)",
                marginBottom: "10px",
              }}
            >
              لقد أتممت المهمة الخاصة!
            </h2>
            <p
              style={{
                color: "#94a3b8",
                fontSize: "18px",
                marginBottom: "30px",
              }}
            >
              {gachaState === "selecting"
                ? "اختر بطاقة واحدة فقط لتكشف عن جائزتك العشوائية."
                : "هذه هي نتيجة سحبك!"}
            </p>

            <div
              style={{ display: "flex", gap: "20px", justifyContent: "center" }}
            >
              {gachaCards.map((card) => {
                const isRevealed = gachaState === "revealed";
                const isSelected = selectedGachaId === card.id;

                let cardClass = "gacha-mystery";
                if (isRevealed) {
                  if (card.type === "normal") cardClass = "gacha-white";
                  else if (card.type === "super") cardClass = "gacha-purple";
                  else if (card.type === "legendary")
                    cardClass = "gacha-yellow";
                }

                return (
                  <div
                    key={card.id}
                    className={`gacha-card ${cardClass}`}
                    style={{
                      opacity: isRevealed && !isSelected ? 0.4 : 1,
                      transform: isSelected
                        ? "scale(1.1)"
                        : isRevealed
                          ? "scale(0.95)"
                          : "scale(1)",
                      pointerEvents: isRevealed ? "none" : "auto",
                    }}
                    onClick={() => claimGachaReward(card.id)}
                  >
                    {!isRevealed ? (
                      <>
                        <Gift
                          size={60}
                          color="#94a3b8"
                          style={{ marginBottom: "15px" }}
                        />
                        <h3
                          style={{
                            fontSize: "20px",
                            fontWeight: "bold",
                            color: "#94a3b8",
                          }}
                        >
                          بطاقة غامضة
                        </h3>
                        <p
                          style={{
                            fontSize: "12px",
                            marginTop: "10px",
                            opacity: 0.5,
                          }}
                        >
                          اضغط للاختيار
                        </p>
                      </>
                    ) : (
                      <>
                        {card.type === "normal" && (
                          <Zap size={60} style={{ marginBottom: "15px" }} />
                        )}
                        {card.type === "super" && (
                          <Coins size={60} style={{ marginBottom: "15px" }} />
                        )}
                        {card.type === "legendary" && (
                          <Sparkles
                            size={60}
                            style={{ marginBottom: "15px" }}
                          />
                        )}

                        <h3 style={{ fontSize: "22px", fontWeight: "bold" }}>
                          {card.type === "normal" && "جائزة عادية"}
                          {card.type === "super" && "جائزة خارقة"}
                          {card.type === "legendary" && "جائزة أسطورية"}
                        </h3>
                        <p
                          style={{
                            fontSize: "18px",
                            fontWeight: "900",
                            marginTop: "10px",
                            color: "#fff",
                          }}
                        >
                          +{card.value}{" "}
                          {card.type === "normal"
                            ? "EXP"
                            : card.type === "super"
                              ? "عملة"
                              : "عملة خاصة"}
                        </p>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {selectedAvatarModal && (
        <div
          className="modal-overlay"
          onClick={() => setSelectedAvatarModal(null)}
        >
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            dir="rtl"
            style={{
              borderColor: selectedAvatarModal.color,
              boxShadow: `0 0 40px ${selectedAvatarModal.color}40`,
              textAlign: "center",
            }}
          >
            <button
              onClick={() => setSelectedAvatarModal(null)}
              style={{
                position: "absolute",
                top: "20px",
                left: "20px",
                background: "transparent",
                border: "none",
                color: "#64748b",
                cursor: "pointer",
              }}
            >
              <X size={28} className="hover:text-white transition-colors" />
            </button>
            <selectedAvatarModal.icon
              size={70}
              color={selectedAvatarModal.color}
              style={{
                margin: "0 auto 15px auto",
                filter: `drop-shadow(0 0 15px ${selectedAvatarModal.color})`,
              }}
            />
            <h2
              style={{
                fontSize: "32px",
                fontWeight: "900",
                color: selectedAvatarModal.color,
                textShadow: `0 0 15px ${selectedAvatarModal.color}80`,
                margin: "0 0 5px 0",
              }}
            >
              {selectedAvatarModal.name}
            </h2>
            <div
              style={{
                fontSize: "14px",
                color: "#64748b",
                letterSpacing: "4px",
                marginBottom: "25px",
                textTransform: "uppercase",
              }}
            >
              {selectedAvatarModal.enName}
            </div>
            <div
              style={{
                backgroundColor: "#0f172a",
                border: `1px solid ${selectedAvatarModal.color}50`,
                padding: "20px",
                borderRadius: "15px",
                marginBottom: "30px",
              }}
            >
              <h3
                style={{
                  fontSize: "18px",
                  color: "#e2e8f0",
                  marginBottom: "10px",
                }}
              >
                القدرة الدائمة:
              </h3>
              <p
                style={{
                  fontSize: "18px",
                  fontWeight: "bold",
                  color: selectedAvatarModal.color,
                }}
              >
                {selectedAvatarModal.desc}
              </p>
            </div>
            {/* --- أزرار التجهيز والشراء --- */}
            {unlockedAvatars.includes(selectedAvatarModal.id) ? (
              <button
                onClick={() => handleEquipAvatar(selectedAvatarModal.id)}
                style={{
                  width: "100%",
                  padding: "15px",
                  backgroundColor:
                    equippedAvatarId === selectedAvatarModal.id
                      ? "#334155"
                      : selectedAvatarModal.color,
                  color:
                    equippedAvatarId === selectedAvatarModal.id
                      ? "#94a3b8"
                      : "#000",
                  border: "none",
                  borderRadius: "12px",
                  fontSize: "18px",
                  fontWeight: "900",
                  cursor:
                    equippedAvatarId === selectedAvatarModal.id
                      ? "not-allowed"
                      : "pointer",
                }}
                disabled={equippedAvatarId === selectedAvatarModal.id}
              >
                {equippedAvatarId === selectedAvatarModal.id
                  ? "مجهز حالياً"
                  : "تجهيز الأفاتار"}
              </button>
            ) : (
              <button
                onClick={() => {
                  if (
                    totalCoins >= selectedAvatarModal.priceCoins &&
                    totalSpecialCoins >= selectedAvatarModal.priceSpecial
                  ) {
                    setTotalCoins(
                      (prev) => prev - selectedAvatarModal.priceCoins,
                    );
                    setTotalSpecialCoins(
                      (prev) => prev - selectedAvatarModal.priceSpecial,
                    );
                    setUnlockedAvatars((prev) => [
                      ...prev,
                      selectedAvatarModal.id,
                    ]);
                    showToast(
                      `تم شراء ${selectedAvatarModal.name} بنجاح!`,
                      "success",
                    );
                    playSuccessSound();
                  } else {
                    showToast("رصيدك لا يكفي لشراء هذا الأفاتار!", "error");
                  }
                }}
                style={{
                  width: "100%",
                  padding: "15px",
                  backgroundColor: "transparent",
                  color: "#fff",
                  border: `2px solid ${selectedAvatarModal.color}`,
                  borderRadius: "12px",
                  fontSize: "18px",
                  fontWeight: "900",
                  cursor: "pointer",
                  display: "flex",
                  justifyContent: "center",
                  gap: "15px",
                  alignItems: "center",
                }}
              >
                شراء الأفاتار بـ:
                {selectedAvatarModal.priceCoins > 0 && (
                  <span
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "5px",
                    }}
                  >
                    {selectedAvatarModal.priceCoins}{" "}
                    <Coins size={20} color="#eab308" />
                  </span>
                )}
                {selectedAvatarModal.priceSpecial > 0 && (
                  <span
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "5px",
                    }}
                  >
                    {selectedAvatarModal.priceSpecial}{" "}
                    <Sparkles size={20} color="#10b981" />
                  </span>
                )}
              </button>
            )}
          </div>
        </div>
      )}

      {selectedTitleModal && (
        <div
          className="modal-overlay"
          onClick={() => setSelectedTitleModal(null)}
        >
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            dir="rtl"
            style={{
              borderColor: selectedTitleModal.color,
              boxShadow: `0 0 40px ${selectedTitleModal.color}40`,
              textAlign: "center",
            }}
          >
            <button
              onClick={() => setSelectedTitleModal(null)}
              style={{
                position: "absolute",
                top: "20px",
                left: "20px",
                background: "transparent",
                border: "none",
                color: "#64748b",
                cursor: "pointer",
              }}
            >
              <X size={28} className="hover:text-white transition-colors" />
            </button>
            <Award
              size={60}
              color={selectedTitleModal.color}
              style={{
                margin: "0 auto 15px auto",
                filter: `drop-shadow(0 0 15px ${selectedTitleModal.color})`,
              }}
            />
            <h2
              style={{
                fontSize: "32px",
                fontWeight: "900",
                color: selectedTitleModal.color,
                textShadow: `0 0 15px ${selectedTitleModal.color}80`,
                margin: "0 0 5px 0",
              }}
            >
              {selectedTitleModal.name}
            </h2>
            <div
              style={{
                fontSize: "14px",
                color: "#64748b",
                letterSpacing: "4px",
                marginBottom: "25px",
                textTransform: "uppercase",
              }}
            >
              {selectedTitleModal.enName}
            </div>
            <div
              style={{
                backgroundColor: "#0f172a",
                border: `1px solid ${selectedTitleModal.color}50`,
                padding: "20px",
                borderRadius: "15px",
                marginBottom: "30px",
              }}
            >
              <h3
                style={{
                  fontSize: "18px",
                  color: "#e2e8f0",
                  marginBottom: "10px",
                }}
              >
                تأثير اللقب:
              </h3>
              <p
                style={{
                  fontSize: "18px",
                  fontWeight: "bold",
                  color: selectedTitleModal.color,
                }}
              >
                {selectedTitleModal.bonusDesc}
              </p>
            </div>
            {currentLevel >= selectedTitleModal.requiredLevel ? (
              <button
                onClick={() => handleEquipTitle(selectedTitleModal.id)}
                style={{
                  width: "100%",
                  padding: "15px",
                  backgroundColor:
                    equippedTitleId === selectedTitleModal.id
                      ? "#334155"
                      : selectedTitleModal.color,
                  color:
                    equippedTitleId === selectedTitleModal.id
                      ? "#94a3b8"
                      : "#000",
                  border: "none",
                  borderRadius: "12px",
                  fontSize: "18px",
                  fontWeight: "900",
                  cursor:
                    equippedTitleId === selectedTitleModal.id
                      ? "not-allowed"
                      : "pointer",
                }}
                disabled={equippedTitleId === selectedTitleModal.id}
              >
                {equippedTitleId === selectedTitleModal.id
                  ? "مجهز حالياً"
                  : "تجهيز اللقب"}
              </button>
            ) : (
              <button
                style={{
                  width: "100%",
                  padding: "15px",
                  backgroundColor: "transparent",
                  color: "#ef4444",
                  border: "2px solid #ef4444",
                  borderRadius: "12px",
                  fontSize: "18px",
                  fontWeight: "900",
                  cursor: "not-allowed",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  gap: "10px",
                }}
                disabled
              >
                <Lock size={20} /> مقفل - يتطلب مستوى{" "}
                {selectedTitleModal.requiredLevel}
              </button>
            )}
          </div>
        </div>
      )}

      {showConfirmModal && pendingTask && (
        <div className="modal-overlay" onClick={cancelAddTask}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            dir="rtl"
            style={{
              border: "2px solid #38bdf8",
              boxShadow: "0 0 30px rgba(56,189,248,0.3)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                justifyContent: "center",
                marginBottom: "20px",
                color: "#38bdf8",
              }}
            >
              <AlertOctagon size={30} />
              <h2 style={{ fontSize: "24px", fontWeight: "900", margin: 0 }}>
                تنبيه من النظام (AI)
              </h2>
            </div>
            <div
              style={{
                backgroundColor: "#0f172a",
                padding: "20px",
                borderRadius: "15px",
                marginBottom: "20px",
                border: "1px solid #1e293b",
              }}
            >
              <h3
                style={{
                  color: "#fff",
                  fontSize: "20px",
                  marginBottom: "10px",
                  borderBottom: "1px solid #334155",
                  paddingBottom: "10px",
                }}
              >
                {pendingTask.title}
              </h3>
              <p
                style={{
                  color: "#94a3b8",
                  fontSize: "15px",
                  lineHeight: "1.6",
                }}
              >
                {pendingTask.desc}
              </p>
            </div>
            <div
              style={{
                display: "flex",
                gap: "10px",
                marginBottom: "20px",
                backgroundColor: "#1e293b",
                padding: "15px",
                borderRadius: "12px",
              }}
            >
              <div
                style={{
                  flex: 1,
                  textAlign: "center",
                  borderLeft: "1px solid #334155",
                }}
              >
                <Clock
                  size={20}
                  color="#cbd5e1"
                  style={{ margin: "0 auto 5px auto" }}
                />
                <div style={{ fontSize: "12px", color: "#94a3b8" }}>
                  الوقت المقدر
                </div>
                <div
                  style={{
                    fontSize: "18px",
                    fontWeight: "bold",
                    color: "#fff",
                  }}
                >
                  {pendingTask.estimatedHours}س و {pendingTask.estimatedMinutes}
                  د
                </div>
              </div>
              <div
                style={{
                  flex: 1,
                  textAlign: "center",
                  borderLeft: "1px solid #334155",
                }}
              >
                <Coins
                  size={20}
                  color="#eab308"
                  style={{ margin: "0 auto 5px auto" }}
                />
                <div style={{ fontSize: "12px", color: "#94a3b8" }}>عملات</div>
                <div
                  style={{
                    fontSize: "18px",
                    fontWeight: "bold",
                    color: "#eab308",
                  }}
                >
                  +{pendingTask.coins}
                </div>
              </div>
              <div style={{ flex: 1, textAlign: "center" }}>
                <Sparkles
                  size={20}
                  color="#10b981"
                  style={{ margin: "0 auto 5px auto" }}
                />
                <div style={{ fontSize: "12px", color: "#94a3b8" }}>
                  عملات خاصة
                </div>
                <div
                  style={{
                    fontSize: "18px",
                    fontWeight: "bold",
                    color: "#10b981",
                  }}
                >
                  +{pendingTask.specialCoins}
                </div>
              </div>
            </div>
            <div style={{ display: "flex", gap: "15px", marginBottom: "25px" }}>
              <div
                style={{
                  flex: 1,
                  backgroundColor: "#083344",
                  border: "1px solid #06b6d4",
                  borderRadius: "12px",
                  padding: "15px",
                  textAlign: "center",
                }}
              >
                <h4
                  style={{
                    fontSize: "12px",
                    color: "#67e8f9",
                    margin: "0 0 5px 0",
                  }}
                >
                  مكافأة الخبرة
                </h4>
                <div
                  style={{
                    fontSize: "18px",
                    fontWeight: "900",
                    color: "#22d3ee",
                  }}
                >
                  +{pendingTask.exp} EXP
                </div>
              </div>
              <div
                style={{
                  flex: 1,
                  backgroundColor: "#4c0519",
                  border: "1px solid #e11d48",
                  borderRadius: "12px",
                  padding: "15px",
                  textAlign: "center",
                }}
              >
                <h4
                  style={{
                    fontSize: "12px",
                    color: "#fda4af",
                    margin: "0 0 5px 0",
                  }}
                >
                  العقوبة (Penalty)
                </h4>
                <div
                  style={{
                    fontSize: "13px",
                    fontWeight: "bold",
                    color: "#fb7185",
                  }}
                >
                  خصم {pendingTask.penaltyExp} EXP و {pendingTask.penaltyCoins}{" "}
                  عملات
                </div>
                <div
                  style={{
                    fontSize: "11px",
                    color: "#fecdd3",
                    marginTop: "4px",
                  }}
                >
                  ({pendingTask.penaltyDesc})
                </div>
              </div>
            </div>
            <div style={{ display: "flex", gap: "15px" }}>
              <button
                onClick={confirmAddTask}
                style={{
                  flex: 1,
                  padding: "15px",
                  backgroundColor: "#0ea5e9",
                  color: "white",
                  border: "none",
                  borderRadius: "12px",
                  fontSize: "16px",
                  fontWeight: "bold",
                  cursor: "pointer",
                  boxShadow: "0 0 15px rgba(14,165,233,0.4)",
                }}
              >
                قبول التحدي
              </button>
              <button
                onClick={cancelAddTask}
                style={{
                  flex: 1,
                  padding: "15px",
                  backgroundColor: "transparent",
                  color: "#94a3b8",
                  border: "1px solid #334155",
                  borderRadius: "12px",
                  fontSize: "16px",
                  fontWeight: "bold",
                  cursor: "pointer",
                }}
              >
                تراجع
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedTask && (
        <div className="modal-overlay" onClick={closeTaskModal}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            dir="rtl"
          >
            <button
              onClick={closeTaskModal}
              style={{
                position: "absolute",
                top: "20px",
                left: "20px",
                background: "transparent",
                border: "none",
                color: "#64748b",
                cursor: "pointer",
              }}
            >
              <X size={28} className="hover:text-white transition-colors" />
            </button>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "15px",
                borderBottom: "1px solid #1e293b",
                paddingBottom: "20px",
                marginBottom: "25px",
              }}
            >
              {selectedTask.icon}
              <h2
                style={{
                  fontSize: "24px",
                  fontWeight: "900",
                  color: "#fff",
                  margin: 0,
                }}
              >
                {selectedTask.title}
              </h2>
            </div>
            <div style={{ marginBottom: "20px" }}>
              <h3
                style={{
                  fontSize: "16px",
                  color: "#94a3b8",
                  marginBottom: "10px",
                }}
              >
                وصف المهمة:
              </h3>
              <p
                style={{
                  fontSize: "16px",
                  color: "#e2e8f0",
                  lineHeight: "1.6",
                }}
              >
                {selectedTask.desc}
              </p>
            </div>

            <div
              style={{
                display: "flex",
                gap: "10px",
                marginBottom: "20px",
                backgroundColor: "#1e293b",
                padding: "15px",
                borderRadius: "12px",
              }}
            >
              <div
                style={{
                  flex: 1,
                  textAlign: "center",
                  borderLeft: "1px solid #334155",
                }}
              >
                <Clock
                  size={20}
                  color="#cbd5e1"
                  style={{ margin: "0 auto 5px auto" }}
                />
                <div style={{ fontSize: "12px", color: "#94a3b8" }}>
                  الوقت الأصلي
                </div>
                <div
                  style={{
                    fontSize: "18px",
                    fontWeight: "bold",
                    color: "#fff",
                  }}
                >
                  {formatTime(selectedTask.timeLimit)}
                </div>
              </div>
              <div
                style={{
                  flex: 1,
                  textAlign: "center",
                  borderLeft: "1px solid #334155",
                }}
              >
                <Coins
                  size={20}
                  color="#eab308"
                  style={{ margin: "0 auto 5px auto" }}
                />
                <div style={{ fontSize: "12px", color: "#94a3b8" }}>عملات</div>
                <div
                  style={{
                    fontSize: "18px",
                    fontWeight: "bold",
                    color: "#eab308",
                  }}
                >
                  +{selectedTask.coins}
                </div>
              </div>
              <div style={{ flex: 1, textAlign: "center" }}>
                <Sparkles
                  size={20}
                  color="#10b981"
                  style={{ margin: "0 auto 5px auto" }}
                />
                <div style={{ fontSize: "12px", color: "#94a3b8" }}>
                  عملات خاصة
                </div>
                <div
                  style={{
                    fontSize: "18px",
                    fontWeight: "bold",
                    color: "#10b981",
                  }}
                >
                  +{selectedTask.specialCoins}
                </div>
              </div>
            </div>

            <div style={{ display: "flex", gap: "15px" }}>
              <div
                style={{
                  flex: 1,
                  backgroundColor: "#083344",
                  border: "1px solid #06b6d4",
                  borderRadius: "12px",
                  padding: "20px",
                  textAlign: "center",
                }}
              >
                <h4
                  style={{
                    fontSize: "14px",
                    color: "#67e8f9",
                    margin: "0 0 5px 0",
                  }}
                >
                  الخبرة (EXP)
                </h4>
                <div
                  style={{
                    fontSize: "24px",
                    fontWeight: "900",
                    color: "#22d3ee",
                  }}
                >
                  +{selectedTask.exp} EXP
                </div>
              </div>
              <div
                style={{
                  flex: 1,
                  backgroundColor: "#4c0519",
                  border: "1px solid #e11d48",
                  borderRadius: "12px",
                  padding: "20px",
                  textAlign: "center",
                }}
              >
                <h4
                  style={{
                    fontSize: "14px",
                    color: "#fda4af",
                    margin: "0 0 5px 0",
                  }}
                >
                  العقوبة (Penalty)
                </h4>
                <div
                  style={{
                    fontSize: "16px",
                    fontWeight: "bold",
                    color: "#fb7185",
                    marginBottom: "5px",
                  }}
                >
                  خصم {selectedTask.penaltyExp} EXP و{" "}
                  {selectedTask.penaltyCoins} عملات
                </div>
                <div style={{ fontSize: "12px", color: "#fecdd3" }}>
                  {selectedTask.penaltyDesc}
                </div>
              </div>
            </div>

            {!isCompletingTask ? (
              <div style={{ display: "flex", gap: "15px", marginTop: "30px" }}>
                <button
                  onClick={() => setIsCompletingTask(true)}
                  style={{
                    flex: 1,
                    padding: "15px",
                    backgroundColor: "#22c55e",
                    color: "white",
                    border: "none",
                    borderRadius: "12px",
                    fontSize: "16px",
                    fontWeight: "bold",
                    cursor: "pointer",
                    boxShadow: "0 0 15px rgba(34, 197, 94, 0.3)",
                  }}
                >
                  تم الانتهاء من المهمة
                </button>
                <button
                  onClick={handleWithdrawTask}
                  style={{
                    flex: 1,
                    padding: "15px",
                    backgroundColor: "#ef4444",
                    color: "white",
                    border: "none",
                    borderRadius: "12px",
                    fontSize: "16px",
                    fontWeight: "bold",
                    cursor: "pointer",
                    boxShadow: "0 0 15px rgba(239, 68, 68, 0.3)",
                  }}
                >
                  الانسحاب من المهمة
                </button>
              </div>
            ) : (
              <div
                style={{
                  marginTop: "30px",
                  padding: "20px",
                  backgroundColor: "#0f172a",
                  borderRadius: "15px",
                  border: "1px solid #0ea5e9",
                  textAlign: "center",
                }}
              >
                <h4
                  style={{
                    color: "#fff",
                    fontSize: "20px",
                    marginBottom: "10px",
                  }}
                >
                  أقسم بشرفك أولاً:
                </h4>
                <p
                  style={{
                    color: "#94a3b8",
                    fontSize: "15px",
                    marginBottom: "15px",
                  }}
                >
                  اكتب العبارة التالية بدقة تامة لتفعيل المكافأة:
                  <br />
                  <strong
                    style={{
                      color: "#38bdf8",
                      fontSize: "18px",
                      display: "block",
                      marginTop: "5px",
                      userSelect: "none",
                      WebkitUserSelect: "none",
                    }}
                    onCopy={(e) => {
                      e.preventDefault();
                      showToast("النظام يراقبك: ممنوع النسخ!", "error");
                    }}
                    onContextMenu={(e) => e.preventDefault()}
                  >
                    اقسم اني انهيت المهمه بنجاح ولا اكذب اقسم بالله
                  </strong>
                </p>
                <input
                  type="text"
                  value={oathInput}
                  onChange={(e) => setOathInput(e.target.value)}
                  onPaste={(e) => {
                    e.preventDefault();
                    showToast(
                      "النظام يرفض اللصق! يجب أن تكتب القسم بيدك.",
                      "error",
                    );
                  }}
                  onDrop={(e) => e.preventDefault()}
                  autoComplete="off"
                  placeholder="اكتب القسم هنا حرفاً بحرف..."
                  dir="rtl"
                  style={{
                    width: "90%",
                    display: "block",
                    margin: "0 auto 15px auto",
                    backgroundColor: "#1e293b",
                    border: "1px solid #334155",
                    borderRadius: "8px",
                    padding: "10px",
                    color: "white",
                    fontSize: "15px",
                    outline: "none",
                    textAlign: "center",
                  }}
                />
                <button
                  onClick={handleVerifyOath}
                  style={{
                    width: "90%",
                    margin: "0 auto",
                    display: "block",
                    padding: "12px",
                    backgroundColor: "#0ea5e9",
                    color: "white",
                    border: "none",
                    borderRadius: "12px",
                    fontSize: "16px",
                    fontWeight: "bold",
                    cursor: "pointer",
                    boxShadow: "0 0 15px rgba(14,165,233,0.4)",
                  }}
                >
                  تأكيد القسم واستلام المكافأة
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <div
        dir="rtl"
        style={{
          display: "flex",
          height: "100vh",
          backgroundColor: "#030508",
          color: "white",
          fontFamily: "system-ui, sans-serif",
          overflow: "hidden",
        }}
      >
        <aside
          style={{
            width: "350px",
            backgroundColor: "#0a0d14",
            borderLeft: "1px solid #083344",
            display: "flex",
            flexDirection: "column",
            boxShadow: "-10px 0 30px rgba(0,0,0,0.8)",
            zIndex: 10,
          }}
        >
          <div style={{ padding: "25px", borderBottom: "1px solid #083344" }}>
            <div
              onClick={() => setSelectedAvatarModal(getEquippedAvatar())}
              style={{
                width: "90px",
                height: "90px",
                borderRadius: "50%",
                border: `3px solid ${getEquippedAvatar().color}`,
                boxShadow: `0 0 25px ${getEquippedAvatar().color}60`,
                display: "flex",
                alignItems: "center",
                justifyItems: "center",
                margin: "0 auto 20px auto",
                backgroundColor: "#0f172a",
                cursor: "pointer",
              }}
            >
              {React.createElement(getEquippedAvatar().icon, {
                size: 45,
                color: getEquippedAvatar().color,
                style: { margin: "auto" },
              })}
            </div>

            <div className="youssef-name">[ YOUSSEF ]</div>

            <div
              style={{
                display: "flex",
                backgroundColor: "#05070a",
                border: "1px solid #1f2937",
                borderRadius: "12px",
                padding: "15px 0",
                marginBottom: "15px",
              }}
            >
              <div
                style={{
                  flex: 1,
                  textAlign: "center",
                  borderLeft: "1px solid #1f2937",
                  cursor: "pointer",
                }}
                onClick={() =>
                  showToast(
                    `الترقية القادمة تتطلب إجمالي ${nextLevelExp} EXP (الحالي: ${totalExp})`,
                    "buff",
                  )
                }
              >
                <div
                  style={{
                    fontSize: "11px",
                    color: "#6b7280",
                    letterSpacing: "2px",
                    marginBottom: "5px",
                  }}
                >
                  LEVEL
                </div>
                <div
                  style={{
                    fontSize: "26px",
                    fontWeight: "900",
                    color: "#eab308",
                    textShadow: "0 0 15px rgba(234,179,8,0.5)",
                  }}
                >
                  {currentLevel}
                </div>
              </div>
              <div
                style={{ flex: 1, textAlign: "center", cursor: "pointer" }}
                onClick={() => setActiveTab("titles")}
              >
                <div
                  style={{
                    fontSize: "11px",
                    color: "#6b7280",
                    letterSpacing: "2px",
                    marginBottom: "5px",
                  }}
                >
                  اللقب
                </div>
                <div
                  style={{
                    fontSize: "18px",
                    fontWeight: "900",
                    color: getEquippedTitle().color,
                    textShadow: `0 0 15px ${getEquippedTitle().color}80`,
                  }}
                >
                  {getEquippedTitle().name}
                </div>
              </div>
            </div>

            {isShadowMonarchReady && (
              <button
                onClick={() => {
                  setMainMultiplier(2); // تم التعديل لـ 2x
                  setSideMultiplier(2); // تم التعديل لـ 2x
                  setShadowMonarchLastUsed(Date.now());
                  showToast(
                    "استيقظ ملك الظلال! مضاعف 2x لجميع المهام.",
                    "buff",
                  );
                  playSuccessSound();
                }}
                style={{
                  width: "100%",
                  padding: "10px",
                  backgroundColor: "#6366f1",
                  color: "white",
                  borderRadius: "10px",
                  border: "1px solid #818cf8",
                  fontWeight: "bold",
                  cursor: "pointer",
                  marginBottom: "15px",
                  boxShadow: "0 0 15px rgba(99, 102, 241, 0.4)",
                  animation: "pulse 2s infinite",
                }}
              >
                تفعيل قدرة ملك الظلال (2x)
              </button>
            )}

            {(shields > 0 || mainMultiplier > 1 || sideMultiplier > 1) && (
              <div className="active-buffs">
                <div
                  style={{
                    fontSize: "12px",
                    color: "#94a3b8",
                    marginBottom: "8px",
                  }}
                >
                  القدرات النشطة:
                </div>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "5px",
                  }}
                >
                  {shields > 0 && (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        color: "#c084fc",
                        fontSize: "13px",
                        fontWeight: "bold",
                      }}
                    >
                      <Shield size={16} /> درع حماية (x{shields})
                    </div>
                  )}
                  {mainMultiplier > 1 && (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        color: "#22d3ee",
                        fontSize: "13px",
                        fontWeight: "bold",
                      }}
                    >
                      <Zap size={16} /> مضاعف رئيسي ({mainMultiplier}x)
                    </div>
                  )}
                  {sideMultiplier > 1 && (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        color: "#fcd34d",
                        fontSize: "13px",
                        fontWeight: "bold",
                      }}
                    >
                      <Zap size={16} /> مضاعف فرعي ({sideMultiplier}x)
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="exp-box">
              <div className="exp-title">TOTAL EXP</div>
              <div className="exp-number">{totalExp}</div>
            </div>

            <div className="currency-box currency-primary">
              <div
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                <Coins size={18} color="#eab308" />
                <span
                  style={{
                    color: "#d1d5db",
                    fontSize: "15px",
                    fontWeight: "bold",
                  }}
                >
                  العملة :
                </span>
              </div>
              <span
                style={{
                  color: "#eab308",
                  fontWeight: "900",
                  fontSize: "18px",
                }}
              >
                {totalCoins}
              </span>
            </div>
            <div className="currency-box currency-special">
              <div
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                <Sparkles size={18} color="#10b981" />
                <span
                  style={{
                    color: "#d1d5db",
                    fontSize: "15px",
                    fontWeight: "bold",
                  }}
                >
                  العملة الخاصة :
                </span>
              </div>
              <span
                style={{
                  color: "#10b981",
                  fontWeight: "900",
                  fontSize: "18px",
                }}
              >
                {totalSpecialCoins}
              </span>
            </div>
          </div>

          <nav
            style={{
              flex: 1,
              padding: "20px",
              display: "flex",
              flexDirection: "column",
              gap: "8px",
              overflowY: "auto",
            }}
          >
            {tabs.map((tab) => {
              const isShopLocked = tab.id === "shop" && equippedAvatarId !== 2;
              const isAiLocked = tab.id === "ai" && equippedAvatarId !== 3;
              const isSpecialLocked =
                tab.id === "special" && equippedAvatarId !== 4;
              const isLocked = isShopLocked || isAiLocked || isSpecialLocked;
              const tabColor = isLocked
                ? "#475569"
                : activeTab === tab.id
                  ? "#22d3ee"
                  : "#cbd5e1";

              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    if (!isLocked) setActiveTab(tab.id);
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "14px",
                    backgroundColor:
                      activeTab === tab.id ? "#083344" : "#1e293b",
                    color: tabColor,
                    border:
                      activeTab === tab.id
                        ? "1px solid #06b6d4"
                        : "1px solid transparent",
                    borderRadius: "10px",
                    cursor: isLocked ? "not-allowed" : "pointer",
                    transition: "all 0.2s",
                    opacity: isLocked ? 0.6 : 1,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "15px",
                    }}
                  >
                    {tab.icon(tabColor)}
                    <span style={{ fontSize: "16px", fontWeight: "bold" }}>
                      {tab.name}
                    </span>
                  </div>
                  {isLocked && <Lock size={16} color="#475569" />}
                </button>
              );
            })}
          </nav>
        </aside>

        <main
          style={{
            flex: 1,
            padding: "40px",
            backgroundColor: "#030508",
            overflowY: "auto",
          }}
        >
          {activeTab === "special" && (
            <div style={{ maxWidth: "850px", margin: "0 auto" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "15px",
                  marginBottom: "30px",
                  borderBottom: "1px solid #78350f",
                  paddingBottom: "20px",
                }}
              >
                <Target size={40} color="#f59e0b" />
                <div>
                  <h2
                    style={{
                      fontSize: "32px",
                      fontWeight: "900",
                      color: "#f59e0b",
                      margin: 0,
                      textShadow: "0 0 10px rgba(245,158,11,0.5)",
                    }}
                  >
                    المهام الخاصة (AI Directives)
                  </h2>
                  <p style={{ color: "#94a3b8", margin: "5px 0 0 0" }}>
                    مهام يفرضها الذكاء الاصطناعي لتطوير مهاراتك الحقيقية. أكملها
                    لفتح الغنائم الأسطورية.
                  </p>
                </div>
              </div>

              {specialQuests.length === 0 ? (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    height: "400px",
                    backgroundColor: "#0a0d14",
                    border: "1px solid #1e293b",
                    borderRadius: "15px",
                  }}
                >
                  <Lock
                    size={80}
                    color="#475569"
                    style={{ marginBottom: "20px" }}
                  />
                  <h3
                    style={{
                      fontSize: "24px",
                      color: "#94a3b8",
                      marginBottom: "10px",
                    }}
                  >
                    يتم تجهيز المهمة التالية بعد:
                  </h3>
                  <div
                    style={{
                      fontSize: "48px",
                      fontWeight: "900",
                      color: "#f59e0b",
                      fontFamily: "monospace",
                      textShadow: "0 0 15px rgba(245,158,11,0.5)",
                      marginBottom: "30px",
                    }}
                  >
                    {formatTime(specialCountdown)}
                  </div>

                  {specialCountdown === 0 && (
                    <button
                      onClick={generateSpecialQuests}
                      style={{
                        padding: "15px 40px",
                        backgroundColor: "#f59e0b",
                        color: "#fff",
                        border: "none",
                        borderRadius: "12px",
                        fontSize: "18px",
                        fontWeight: "bold",
                        cursor: "pointer",
                        boxShadow: "0 0 20px rgba(245,158,11,0.4)",
                        animation: "pulse 2s infinite",
                      }}
                    >
                      استقبال أوامر النظام
                    </button>
                  )}
                </div>
              ) : (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "15px",
                  }}
                >
                  {specialQuests.map((quest) => (
                    <div
                      key={quest.id}
                      className="task-card special-quest"
                      onClick={() => {
                        setSpecialQuestOath(quest);
                        setOathInput("");
                      }}
                      style={{ borderLeft: "4px solid #f59e0b" }}
                    >
                      <Award size={35} color="#f59e0b" />
                      <div style={{ flex: 1 }}>
                        <h3
                          style={{
                            fontSize: "20px",
                            fontWeight: "bold",
                            color: "#fff",
                            margin: "0 0 8px 0",
                          }}
                        >
                          {quest.title}{" "}
                          <span style={{ fontSize: "12px", color: "#64748b" }}>
                            [SPECIAL]
                          </span>
                        </h3>
                        <p
                          style={{
                            fontSize: "14px",
                            color: "#e2e8f0",
                            margin: 0,
                            lineHeight: "1.6",
                          }}
                        >
                          {quest.desc}
                        </p>
                      </div>
                      <div
                        style={{
                          fontSize: "16px",
                          fontWeight: "bold",
                          color: "#fcd34d",
                          backgroundColor: "#451a03",
                          padding: "10px 15px",
                          borderRadius: "10px",
                          border: "1px solid #92400e",
                        }}
                      >
                        اضغط عند الانتهاء
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "avatar" && (
            <div style={{ maxWidth: "900px", margin: "0 auto" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "15px",
                  marginBottom: "30px",
                  borderBottom: "1px solid #334155",
                  paddingBottom: "20px",
                }}
              >
                <UserCircle size={40} color="#ff479c" />
                <div>
                  <h2
                    style={{
                      fontSize: "32px",
                      fontWeight: "900",
                      color: "#ff479c",
                      margin: 0,
                    }}
                  >
                    مستودع الأفاتار
                  </h2>
                  <p style={{ color: "#94a3b8", margin: "5px 0 0 0" }}>
                    كل أفاتار يمتلك قدرة فريدة أو مفتاحاً لقسم سري. اختر بحكمة.
                  </p>
                </div>
              </div>
              <div className="card-grid">
                {avatarsList.map((avatar) => {
                  const isUnlocked = unlockedAvatars.includes(avatar.id);
                  return (
                    <div
                      key={avatar.id}
                      onClick={() => setSelectedAvatarModal(avatar)}
                      className={`item-card ${equippedAvatarId === avatar.id ? "equipped" : ""}`}
                      style={{
                        borderColor: isUnlocked ? avatar.color : "#334155",
                        boxShadow:
                          equippedAvatarId === avatar.id
                            ? `0 0 20px ${avatar.color}40`
                            : "none",
                        opacity: isUnlocked ? 1 : 0.6,
                      }}
                    >
                      {equippedAvatarId === avatar.id && (
                        <div
                          style={{
                            position: "absolute",
                            top: "10px",
                            right: "10px",
                          }}
                        >
                          <CheckCircle size={20} color={avatar.color} />
                        </div>
                      )}
                      {!isUnlocked && (
                        <div
                          style={{
                            position: "absolute",
                            top: "10px",
                            right: "10px",
                          }}
                        >
                          <Lock size={20} color="#94a3b8" />
                        </div>
                      )}
                      <avatar.icon
                        size={40}
                        color={isUnlocked ? avatar.color : "#64748b"}
                        style={{ marginBottom: "15px" }}
                      />
                      <h3
                        style={{
                          fontSize: "20px",
                          fontWeight: "900",
                          color: isUnlocked ? avatar.color : "#94a3b8",
                          margin: "0 0 5px 0",
                        }}
                      >
                        {avatar.name}
                      </h3>
                      <div
                        style={{
                          fontSize: "11px",
                          color: "#64748b",
                          letterSpacing: "2px",
                          textTransform: "uppercase",
                        }}
                      >
                        {avatar.enName}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === "titles" && (
            <div style={{ maxWidth: "900px", margin: "0 auto" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "15px",
                  marginBottom: "30px",
                  borderBottom: "1px solid #334155",
                  paddingBottom: "20px",
                }}
              >
                <Award size={40} color="#fbbf24" />
                <div>
                  <h2
                    style={{
                      fontSize: "32px",
                      fontWeight: "900",
                      color: "#fbbf24",
                      margin: 0,
                    }}
                  >
                    معرض الألقاب
                  </h2>
                  <p style={{ color: "#94a3b8", margin: "5px 0 0 0" }}>
                    جهز اللقب لزيادة المكافآت.
                  </p>
                </div>
              </div>
              <div className="card-grid">
                {titlesList.map((title) => {
                  const isTitleUnlocked = currentLevel >= title.requiredLevel;
                  return (
                    <div
                      key={title.id}
                      onClick={() => setSelectedTitleModal(title)}
                      className={`item-card ${equippedTitleId === title.id ? "equipped" : ""}`}
                      style={{
                        borderColor: isTitleUnlocked ? title.color : "#334155",
                        height: "140px",
                        opacity: isTitleUnlocked ? 1 : 0.6,
                      }}
                    >
                      {equippedTitleId === title.id && (
                        <div
                          style={{
                            position: "absolute",
                            top: "10px",
                            right: "10px",
                          }}
                        >
                          <CheckCircle size={20} color={title.color} />
                        </div>
                      )}
                      {!isTitleUnlocked && (
                        <div
                          style={{
                            position: "absolute",
                            top: "10px",
                            right: "10px",
                          }}
                        >
                          <Lock size={20} color="#94a3b8" />
                        </div>
                      )}
                      <h3
                        style={{
                          fontSize: "22px",
                          fontWeight: "900",
                          color: isTitleUnlocked ? title.color : "#94a3b8",
                          margin: "0 0 5px 0",
                        }}
                      >
                        {title.name}
                      </h3>
                      <div
                        style={{
                          fontSize: "11px",
                          color: "#64748b",
                          letterSpacing: "2px",
                          textTransform: "uppercase",
                        }}
                      >
                        {title.enName}
                      </div>
                      {!isTitleUnlocked && (
                        <div
                          style={{
                            marginTop: "10px",
                            fontSize: "12px",
                            fontWeight: "bold",
                            color: "#ef4444",
                          }}
                        >
                          يفتح عند مستوى {title.requiredLevel}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === "shop" && (
            <div style={{ maxWidth: "900px", margin: "0 auto" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "15px",
                  marginBottom: "30px",
                  borderBottom: "1px solid #334155",
                  paddingBottom: "20px",
                }}
              >
                <Store size={40} color="#a855f7" />
                <div>
                  <h2
                    style={{
                      fontSize: "32px",
                      fontWeight: "900",
                      color: "#a855f7",
                      margin: 0,
                      textShadow: "0 0 10px rgba(168,85,247,0.5)",
                    }}
                  >
                    المتجر السري
                  </h2>
                  <p style={{ color: "#94a3b8", margin: "5px 0 0 0" }}>
                    استبدل عملاتك بقدرات خارقة ووقت إضافي.
                  </p>
                </div>
              </div>

              <div className="card-grid">
                {shopItems.map((item) => (
                  <div
                    key={item.id}
                    className="item-card"
                    style={{
                      borderColor:
                        item.currency === "coins" ? "#eab308" : "#10b981",
                    }}
                  >
                    {item.icon}
                    <h3
                      style={{
                        fontSize: "18px",
                        fontWeight: "900",
                        color: "#fff",
                        margin: "10px 0 5px 0",
                      }}
                    >
                      {item.name}
                    </h3>
                    <p
                      style={{
                        fontSize: "12px",
                        color: "#94a3b8",
                        margin: "0 0 15px 0",
                      }}
                    >
                      {item.desc}
                    </p>

                    <button
                      onClick={() => handleBuyItem(item)}
                      style={{
                        width: "100%",
                        padding: "10px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "8px",
                        backgroundColor:
                          item.currency === "coins" ? "#ca8a04" : "#059669",
                        color: "white",
                        border: "none",
                        borderRadius: "8px",
                        fontSize: "16px",
                        fontWeight: "bold",
                        cursor: "pointer",
                        transition: "all 0.2s",
                      }}
                    >
                      شراء بـ {item.price}{" "}
                      {item.currency === "coins" ? (
                        <Coins size={18} />
                      ) : (
                        <Sparkles size={18} />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "ai" && (
            <div style={{ maxWidth: "850px", margin: "0 auto" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "30px",
                  borderBottom: "1px solid #083344",
                  paddingBottom: "20px",
                }}
              >
                <div
                  style={{ display: "flex", alignItems: "center", gap: "15px" }}
                >
                  <Cpu size={40} color="#06b6d4" />
                  <div>
                    <h2
                      style={{
                        fontSize: "32px",
                        fontWeight: "900",
                        color: "#06b6d4",
                        margin: 0,
                        textShadow: "0 0 10px rgba(6,182,212,0.5)",
                      }}
                    >
                      عقل النظام (AI)
                    </h2>
                    <p style={{ color: "#94a3b8", margin: "5px 0 0 0" }}>
                      تفاوض على مهامك، اطلب زيادة المكافآت أو تقليل العقوبة
                      بالتفكير المنطقي.
                    </p>
                  </div>
                </div>
                <button
                  onClick={clearChat}
                  style={{
                    background: "transparent",
                    border: "1px solid #ef4444",
                    color: "#ef4444",
                    padding: "10px",
                    borderRadius: "8px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "5px",
                  }}
                >
                  <Trash2 size={18} /> تصفية
                </button>
              </div>

              <div className="chat-container">
                <div className="chat-messages">
                  {chatMessages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`msg-bubble ${msg.role === "system" ? "msg-system" : "msg-user"}`}
                    >
                      {msg.text}
                    </div>
                  ))}
                  {isChatThinking && (
                    <div
                      className="msg-bubble msg-system"
                      style={{ opacity: 0.7 }}
                    >
                      النظام يقوم بتحليل صلاحياتك وطلبك...{" "}
                      <Hourglass
                        size={16}
                        className="animate-spin"
                        style={{ display: "inline", marginLeft: "5px" }}
                      />
                    </div>
                  )}
                </div>

                <div className="chat-input-area">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) =>
                      e.key === "Enter" && handleSendChatMessage()
                    }
                    placeholder="اطلب من النظام تعديل المهمة برقمها (مثال: المهمة 101 صعبة، زودني 15 دقيقة)..."
                    style={{
                      flex: 1,
                      backgroundColor: "#1e293b",
                      border: "1px solid #334155",
                      borderRadius: "8px",
                      padding: "15px 20px",
                      color: "white",
                      fontSize: "16px",
                      outline: "none",
                    }}
                    disabled={isChatThinking}
                  />
                  <button
                    onClick={handleSendChatMessage}
                    style={{
                      backgroundColor: "#0ea5e9",
                      color: "white",
                      border: "none",
                      borderRadius: "8px",
                      padding: "0 25px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                    disabled={isChatThinking}
                  >
                    <Send size={20} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {["main", "side"].includes(activeTab) && (
            <div
              style={{ maxWidth: "850px", margin: "0 auto", marginTop: "10px" }}
            >
              <div
                className={`timer-container ${timers[activeTab as "main" | "side"].state === "waiting" ? "timer-waiting" : timers[activeTab as "main" | "side"].state === "active" ? "timer-active" : "timer-success"}`}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    marginBottom: "5px",
                    fontSize: "16px",
                    fontWeight: "bold",
                  }}
                >
                  {timers[activeTab as "main" | "side"].state === "waiting" && (
                    <>
                      <Hourglass size={18} /> بانتظار المهام...
                    </>
                  )}
                  {timers[activeTab as "main" | "side"].state === "active" && (
                    <>
                      <AlertOctagon size={18} /> الوقت المتبقي:
                    </>
                  )}
                  {timers[activeTab as "main" | "side"].state === "success" && (
                    <>
                      <Check size={18} /> تم الإنجاز أو القائمة فارغة.
                    </>
                  )}
                </div>
                <div className="timer-text">
                  {formatTime(timers[activeTab as "main" | "side"].left)}
                </div>
              </div>
              <div
                style={{ display: "flex", gap: "15px", marginBottom: "35px" }}
              >
                <button
                  onClick={() => handleAddClick(activeTab as "main" | "side")}
                  style={{
                    backgroundColor: "#0ea5e9",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    padding: "0 25px",
                    fontSize: "18px",
                    fontWeight: "bold",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                  disabled={isAiThinking}
                >
                  {isAiThinking ? (
                    <Hourglass size={20} className="animate-spin" />
                  ) : (
                    <Plus size={20} />
                  )}{" "}
                  {isAiThinking ? "يحلل..." : "إضافة"}
                </button>
                <input
                  type="text"
                  className="task-input"
                  placeholder="اكتب هدفاً..."
                  value={activeTab === "main" ? mainTaskInput : sideTaskInput}
                  onChange={(e) =>
                    activeTab === "main"
                      ? setMainTaskInput(e.target.value)
                      : setSideTaskInput(e.target.value)
                  }
                  onKeyDown={(e) =>
                    e.key === "Enter" &&
                    handleAddClick(activeTab as "main" | "side")
                  }
                  style={{
                    flex: 1,
                    backgroundColor: "#0f172a",
                    border: "1px solid #0284c7",
                    borderRadius: "8px",
                    padding: "15px 20px",
                    color: "white",
                    fontSize: "16px",
                    outline: "none",
                  }}
                  disabled={isAiThinking}
                />
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "15px",
                }}
              >
                {(activeTab === "main" ? mainTasks : sideTasks).map((task) => (
                  <div
                    key={task.id}
                    className={`task-card ${activeTab}`}
                    onClick={() => setSelectedTask(task)}
                  >
                    {task.icon}
                    <div style={{ flex: 1 }}>
                      <h3
                        style={{
                          fontSize: "20px",
                          fontWeight: "bold",
                          color: "#fff",
                          margin: "0 0 8px 0",
                        }}
                      >
                        {task.title}{" "}
                        <span style={{ fontSize: "12px", color: "#64748b" }}>
                          [ID: {task.id}]
                        </span>
                      </h3>
                      <p
                        style={{
                          fontSize: "14px",
                          color: "#94a3b8",
                          margin: 0,
                        }}
                      >
                        {(task.desc || "").substring(0, 50)}...
                      </p>
                    </div>
                    <div
                      style={{
                        fontSize: "18px",
                        fontWeight: "900",
                        color: activeTab === "main" ? "#67e8f9" : "#fcd34d",
                        backgroundColor:
                          activeTab === "main" ? "#083344" : "#451a03",
                        padding: "10px 20px",
                        borderRadius: "10px",
                        border: `1px solid ${activeTab === "main" ? "#0e7490" : "#92400e"}`,
                      }}
                    >
                      +{task.exp} EXP
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
    </>
  );
}
