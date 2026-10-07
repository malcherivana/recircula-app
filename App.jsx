import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Image,
  SafeAreaView,
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import {
  Activity as ActivityIcon,
  ArrowLeft,
  Eye,
  EyeOff,
  Heart,
  BookOpen,
  MessageSquare,
  Bookmark,
  Camera,
  Check,
  ChevronRight,
  Clock,
  Home as HomeIcon,
  LogOut,
  MapPin,
  MessageCircle,
  Package,
  Plus,
  RefreshCw,
  Search,
  Send,
  Settings,
  ShieldCheck,
  Square,
  Tag,
  User,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import {
  createOrGetConversation,
  getErrorMessage,
  loadAdminDashboard,
  loadConversations,
  loadFavorites,
  loadListings,
  saveFavorite,
  setListingVisibility,
  sendConversationMessage,
} from "./src/lib/data";
import { isSupabaseConfigured, supabase } from "./src/lib/supabase";

const GREEN = "#2F5233";
const GREEN_DARK = "#24402E";
const BG = "#F6F1E7";
const CARD_BG = "#FFFEFB";
const BORDER = "#ECE7D6";
const MUTED = "#8C8672";
const TEXT = "#2B2A25";

const CATEGORIES = [
  { id: "Roupas", label: "Roupas", icon: "tag" },
  { id: "Livros", label: "Livros", icon: "book-open" },
  { id: "Móveis", label: "Móveis", icon: "square" },
  { id: "Outros", label: "Outros", icon: "package" },
];

const ICONS = {
  activity: ActivityIcon,
  "arrow-left": ArrowLeft,
  "book-open": BookOpen,
  bookmark: Bookmark,
  camera: Camera,
  check: Check,
  "chevron-right": ChevronRight,
  clock: Clock,
  eye: Eye,
  "eye-off": EyeOff,
  heart: Heart,
  home: HomeIcon,
  "log-out": LogOut,
  "map-pin": MapPin,
  "message-circle": MessageCircle,
  "message-square": MessageSquare,
  package: Package,
  plus: Plus,
  "refresh-cw": RefreshCw,
  search: Search,
  send: Send,
  settings: Settings,
  shield: ShieldCheck,
  square: Square,
  tag: Tag,
  user: User,
  "user-plus": UserPlus,
  users: Users,
  x: X,
};

function Feather({ name, size = 24, color = "currentColor", style }) {
  const Icon = ICONS[name] || Package;
  return <Icon size={size} color={color} style={style} aria-hidden="true" />;
}

const SEED_ITEMS = [
  {
    id: 1,
    title: "Estante de Madeira Maciça",
    description:
      "Estante antiga em excelente estado de conservação, feita de madeira maciça e resistente. Está guardada em local seco há alguns meses e precisa de espaço para novos planos na casa. Retirada combinada com quem tiver interesse no bairro Pinheiros.",
    category: "Móveis",
    tipo: "Doação",
    bairro: "Pinheiros",
    cidade: "São Paulo",
    dono: "Mariana Silva",
    membro: "Membro desde 2023",
  },
  {
    id: 2,
    title: "Livros de Ficção",
    description:
      "Coleção com 15 livros de ficção científica e fantasia, todos em bom estado de conservação. Trocaria por livros de não ficção ou biografias.",
    category: "Livros",
    tipo: "Doação",
    bairro: "Vila Madalena",
    cidade: "São Paulo",
    dono: "Rafael Costa",
    membro: "Membro desde 2022",
  },
  {
    id: 3,
    title: "Roupas Infantis",
    description:
      "Sacola com roupas infantis de 2 a 4 anos, todas lavadas e em ótimo estado. Meu filho cresceu rápido e quase não deu tempo de usar tudo.",
    category: "Roupas",
    tipo: "Doação",
    bairro: "Jardins",
    cidade: "São Paulo",
    dono: "Camila Alves",
    membro: "Membro desde 2024",
  },
  {
    id: 4,
    title: "Mesa de Escritório",
    description:
      "Mesa de escritório em MDF, tampo espaçoso, pé firme. Pequenas marcas de uso mas nada que atrapalhe. Ideal para home office.",
    category: "Móveis",
    tipo: "Doação",
    bairro: "Butantã",
    cidade: "São Paulo",
    dono: "Diego Souza",
    membro: "Membro desde 2023",
  },
  {
    id: 5,
    title: "Bicicleta Aro 26",
    description:
      "Bicicleta aro 26, pneus novos, marchas funcionando perfeitamente. Usava para pedalar no parque nos finais de semana. Trocaria por outra bike menor ou equipamento de ginástica.",
    category: "Outros",
    tipo: "Troca",
    bairro: "Pinheiros",
    cidade: "São Paulo",
    dono: "Otávio Ramos",
    membro: "Membro desde 2021",
  },
  {
    id: 6,
    title: "Vasos Decorativos",
    description:
      "Conjunto de 4 vasos de cerâmica para plantas, tamanhos variados. Combinam com qualquer decoração, uso de poucos meses.",
    category: "Outros",
    tipo: "Doação",
    bairro: "Pinheiros",
    cidade: "São Paulo",
    dono: "Bianca Ferreira",
    membro: "Membro desde 2024",
  },
];

const MOCK_THREADS = [
  {
    id: "t1",
    contato: "Rafael Costa",
    itemTitle: "Livros de Ficção",
    messages: [
      { id: "m1", from: "them", text: "Oi! Vi que você curtiu o anúncio dos livros, ainda estão disponíveis 😊" },
      { id: "m2", from: "me", text: "Que ótimo! Posso passar aí no sábado de manhã?" },
      { id: "m3", from: "them", text: "Perfeito, te mando o endereço certinho mais perto do dia." },
    ],
  },
  {
    id: "t2",
    contato: "Bianca Ferreira",
    itemTitle: "Vasos Decorativos",
    messages: [
      { id: "m1", from: "them", text: "Oi, os vasos ainda estão de pé rs. Quer combinar a retirada essa semana?" },
    ],
  },
];

const emptyForm = {
  title: "",
  description: "",
  category: "Móveis",
  tipo: "Doação",
  bairro: "",
  cidade: "",
};

const emptyLogin = { email: "", password: "" };
const emptySignup = { name: "", email: "", password: "", bairro: "", cidade: "" };

function categoryIcon(category) {
  return CATEGORIES.find((c) => c.id === category)?.icon || "package";
}

function initials(name) {
  if (!name) return "?";
  return name.trim().charAt(0).toUpperCase();
}

function PrototypeApp() {
  const [screen, setScreen] = useState("splash");
  const [tab, setTab] = useState("home");
  const [items, setItems] = useState(SEED_ITEMS);
  const [activeId, setActiveId] = useState(null);
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");
  const [interested, setInterested] = useState({});
  const [saved, setSaved] = useState({});

  const [auth, setAuth] = useState(null);
  const [loginForm, setLoginForm] = useState(emptyLogin);
  const [signupForm, setSignupForm] = useState(emptySignup);
  const [authError, setAuthError] = useState("");

  const [threads, setThreads] = useState(MOCK_THREADS);
  const [activeThreadId, setActiveThreadId] = useState(null);
  const [draftMessage, setDraftMessage] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((it) => {
      const matchesQuery =
        !q || it.bairro.toLowerCase().includes(q) || it.cidade.toLowerCase().includes(q);
      const matchesCategory = !categoryFilter || it.category === categoryFilter;
      return matchesQuery && matchesCategory;
    });
  }, [items, query, categoryFilter]);

  const activeItem = items.find((it) => it.id === activeId);
  const activeThread = threads.find((t) => t.id === activeThreadId);
  const myItems = auth && !auth.guest ? items.filter((it) => it.dono === auth.name) : [];

  function goTab(name) {
    if (name === "admin" && !isAdmin) return;
    setTab(name);
    if (name === "messages") {
      setActiveThreadId(null);
      setScreen("messages");
    } else if (name === "create") {
      setScreen("create");
    } else {
      setScreen(name);
    }
  }

  function openDetail(id) {
    setActiveId(id);
    setScreen("detail");
  }

  function handleFormChange(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
    setFormError("");
  }

  function submitForm() {
    if (!form.title.trim() || !form.description.trim() || !form.bairro.trim() || !form.cidade.trim()) {
      setFormError("Preencha título, descrição, bairro e cidade antes de publicar.");
      return;
    }
    const newItem = {
      id: Date.now(),
      title: form.title.trim(),
      description: form.description.trim(),
      category: form.category,
      tipo: form.tipo,
      bairro: form.bairro.trim(),
      cidade: form.cidade.trim(),
      dono: auth?.name || "Você",
      membro: "Membro desde 2026",
    };
    setItems((prev) => [newItem, ...prev]);
    setForm(emptyForm);
    setTab("home");
    setScreen("home");
  }

  function handleLogin() {
    if (!loginForm.email.trim() || !loginForm.password.trim()) {
      setAuthError("Preencha e-mail e senha para entrar.");
      return;
    }
    const name = loginForm.email.split("@")[0];
    setAuth({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      email: loginForm.email.trim(),
      bairro: "Pinheiros",
      cidade: "São Paulo",
      guest: false,
    });
    setAuthError("");
    setLoginForm(emptyLogin);
    setTab("home");
    setScreen("home");
  }

  function handleSignup() {
    if (!signupForm.name.trim() || !signupForm.email.trim() || !signupForm.password.trim()) {
      setAuthError("Preencha nome, e-mail e senha para criar sua conta.");
      return;
    }
    setAuth({
      name: signupForm.name.trim(),
      email: signupForm.email.trim(),
      bairro: signupForm.bairro.trim() || "Não informado",
      cidade: signupForm.cidade.trim() || "Não informado",
      guest: false,
    });
    setAuthError("");
    setSignupForm(emptySignup);
    setTab("home");
    setScreen("home");
  }

  function continueAsGuest() {
    setAuth({ name: "Convidado", email: "", bairro: "", cidade: "", guest: true });
    setTab("home");
    setScreen("home");
  }

  function logout() {
    setAuth(null);
    setTab("home");
    setScreen("login");
  }

  function openOrCreateThread(item) {
    const existing = threads.find((t) => t.contato === item.dono && t.itemTitle === item.title);
    if (existing) {
      setActiveThreadId(existing.id);
    } else {
      const newThread = {
        id: `t${Date.now()}`,
        contato: item.dono,
        itemTitle: item.title,
        messages: [
          {
            id: `m${Date.now()}`,
            from: "them",
            text: `Oi! Obrigado pelo interesse em "${item.title}". Vamos combinar os detalhes por aqui.`,
          },
        ],
      };
      setThreads((prev) => [newThread, ...prev]);
      setActiveThreadId(newThread.id);
    }
  }

  function sendMessage() {
    if (!draftMessage.trim() || !activeThreadId) return;
    setThreads((prev) =>
      prev.map((t) =>
        t.id === activeThreadId
          ? { ...t, messages: [...t.messages, { id: `m${Date.now()}`, from: "me", text: draftMessage.trim() }] }
          : t
      )
    );
    setDraftMessage("");
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={BG} />
      <View style={styles.screenArea}>
        {screen === "splash" && (
          <Splash onStart={() => setScreen(auth ? "home" : "login")} />
        )}

        {screen === "login" && (
          <Login
            form={loginForm}
            onChange={(f, v) => { setLoginForm((s) => ({ ...s, [f]: v })); setAuthError(""); }}
            onSubmit={handleLogin}
            onGoSignup={() => { setAuthError(""); setScreen("signup"); }}
            onGuest={continueAsGuest}
            error={authError}
          />
        )}

        {screen === "signup" && (
          <Signup
            form={signupForm}
            onChange={(f, v) => { setSignupForm((s) => ({ ...s, [f]: v })); setAuthError(""); }}
            onSubmit={handleSignup}
            onGoLogin={() => { setAuthError(""); setScreen("login"); }}
            error={authError}
          />
        )}

        {screen === "home" && (
          <Home
            items={filtered}
            query={query}
            setQuery={setQuery}
            categoryFilter={categoryFilter}
            setCategoryFilter={setCategoryFilter}
            onOpen={openDetail}
          />
        )}
        {screen === "search" && (
          <SearchResults items={filtered} query={query} setQuery={setQuery} onOpen={openDetail} />
        )}
        {screen === "detail" && activeItem && (
          <Detail
            item={activeItem}
            isOwner={activeItem.ownerId === auth?.id}
            onBack={() => setScreen(tab === "search" ? "search" : "home")}
            interested={!!interested[activeItem.id]}
            onInterest={() => {
              setInterested((prev) => ({ ...prev, [activeItem.id]: true }));
              openOrCreateThread(activeItem);
            }}
            saved={!!saved[activeItem.id]}
            toggleSaved={() => setSaved((s) => ({ ...s, [activeItem.id]: !s[activeItem.id] }))}
            onGoConversation={() => {
              openOrCreateThread(activeItem);
              setTab("messages");
              setScreen("thread");
            }}
          />
        )}
        {screen === "create" && (
          <CreateListing
            form={form}
            onChange={handleFormChange}
            onSubmit={submitForm}
            onCancel={() => { setTab("home"); setScreen("home"); }}
            error={formError}
          />
        )}

        {screen === "messages" && (
          <MessagesList
            threads={threads}
            onOpen={(id) => { setActiveThreadId(id); setScreen("thread"); }}
          />
        )}
        {screen === "thread" && activeThread && (
          <Thread
            thread={activeThread}
            draft={draftMessage}
            setDraft={setDraftMessage}
            onSend={sendMessage}
            onBack={() => setScreen("messages")}
          />
        )}

        {screen === "profile" && (
          <Profile
            auth={auth}
            myItems={myItems}
            onOpenItem={openDetail}
            onLogout={logout}
            onGoSignup={() => setScreen("signup")}
          />
        )}
      </View>

      {["home", "search", "create", "messages", "thread", "profile"].includes(screen) && (
        <BottomNav active={tab} onChange={goTab} />
      )}
    </SafeAreaView>
  );
}

export default function App() {
  const [screen, setScreen] = useState("splash");
  const [tab, setTab] = useState("home");
  const [items, setItems] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [formError, setFormError] = useState("");
  const [imageAsset, setImageAsset] = useState(null);
  const [interested, setInterested] = useState({});
  const [saved, setSaved] = useState({});
  const [auth, setAuth] = useState(null);
  const [isGuest, setIsGuest] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [loginForm, setLoginForm] = useState({ ...emptyLogin });
  const [signupForm, setSignupForm] = useState({ ...emptySignup });
  const [authError, setAuthError] = useState("");
  const [notice, setNotice] = useState("");
  const [threads, setThreads] = useState([]);
  const [adminDashboard, setAdminDashboard] = useState(null);
  const [adminLoading, setAdminLoading] = useState(false);
  const [activeThreadId, setActiveThreadId] = useState(null);
  const [draftMessage, setDraftMessage] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!supabase) {
      setAuthReady(true);
      return undefined;
    }

    let mounted = true;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      const user = session?.user || null;
      setAuth(user);
      setIsGuest(false);
      if (user?.app_metadata?.role !== "admin") setAdminDashboard(null);
      if (event === "SIGNED_OUT") {
        setScreen("login");
        setTab("home");
      }
    });

    supabase.auth.getSession().then(({ data, error }) => {
      if (!mounted) return;
      if (error) {
        setNotice(getErrorMessage(error));
      }
      const user = data.session?.user || null;
      setAuth(user);
      if (user?.app_metadata?.role !== "admin") setAdminDashboard(null);
      setScreen(user ? "home" : "splash");
      setAuthReady(true);
    }).catch((error) => {
      if (mounted) {
        setNotice(getErrorMessage(error));
        setAuthReady(true);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => () => {
    if (imageAsset?.uri) URL.revokeObjectURL(imageAsset.uri);
  }, [imageAsset]);

  useEffect(() => {
    if (!isSupabaseConfigured || !authReady) return undefined;
    let mounted = true;
    const userId = auth?.id;

    async function refreshData() {
      try {
        const [listings, favorites, conversations] = await Promise.all([
          loadListings(),
          userId ? loadFavorites(userId) : Promise.resolve({}),
          userId ? loadConversations(userId) : Promise.resolve([]),
        ]);
        if (mounted) {
          setItems(listings);
          setSaved(favorites);
          setThreads(conversations);
          setNotice("");
        }
      } catch (error) {
        if (mounted) setNotice(getErrorMessage(error));
      }
    }

    refreshData();
    return () => {
      mounted = false;
    };
  }, [auth?.id, authReady]);

  useEffect(() => {
    if (!auth || !["messages", "thread"].includes(screen)) return undefined;
    let mounted = true;
    const refreshConversations = async () => {
      try {
        const conversations = await loadConversations(auth.id);
        if (mounted) setThreads(conversations);
      } catch (error) {
        if (mounted) setNotice(getErrorMessage(error));
      }
    };

    refreshConversations();
    const intervalId = setInterval(refreshConversations, 10000);
    return () => {
      mounted = false;
      clearInterval(intervalId);
    };
  }, [auth?.id, screen]);

  useEffect(() => {
    if (!auth || !isAdmin || screen !== "admin") return undefined;
    let mounted = true;
    const refreshDashboard = async () => {
      setAdminLoading(true);
      try {
        const dashboard = await loadAdminDashboard();
        if (mounted) {
          setAdminDashboard(dashboard);
          setNotice("");
        }
      } catch (error) {
        if (mounted) setNotice(getErrorMessage(error));
      } finally {
        if (mounted) setAdminLoading(false);
      }
    };

    refreshDashboard();
    const intervalId = setInterval(refreshDashboard, 30000);
    return () => {
      mounted = false;
      clearInterval(intervalId);
    };
  }, [auth?.id, isAdmin, screen]);

  const filtered = useMemo(() => {
    const q = query.trim().toLocaleLowerCase("pt-BR");
    return items.filter((item) => {
      const searchable = `${item.title} ${item.description} ${item.bairro} ${item.cidade} ${item.category}`.toLocaleLowerCase("pt-BR");
      return (!q || searchable.includes(q)) && (!categoryFilter || item.category === categoryFilter);
    });
  }, [items, query, categoryFilter]);

  const activeItem = items.find((item) => item.id === activeId);
  const activeThread = threads.find((thread) => thread.id === activeThreadId);
  const myItems = auth ? items.filter((item) => item.ownerId === auth.id) : [];
  const userMetadata = auth?.user_metadata || {};
  const isAdmin = auth?.app_metadata?.role === "admin";
  const profile = auth
    ? {
        name: userMetadata.display_name || "Membro",
        bairro: userMetadata.neighborhood || "Local não informado",
        cidade: userMetadata.city || "Local não informado",
        guest: false,
      }
    : isGuest
      ? { name: "Convidado", bairro: "", cidade: "", guest: true }
      : null;

  function requireUser() {
    if (auth) return true;
    setAuthError("Entre ou crie uma conta para usar este recurso.");
    setScreen("login");
    return false;
  }

  function goTab(name) {
    setTab(name);
    if (["create", "messages"].includes(name) && !requireUser()) return;
    if (name === "messages") setActiveThreadId(null);
    setScreen(name);
  }

  function openDetail(id) {
    setActiveId(id);
    setScreen("detail");
  }

  function handleFormChange(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
    setFormError("");
  }

  async function handleLogin() {
    if (!supabase || busy) return;
    const email = loginForm.email.trim().toLowerCase();
    if (!email || !email.includes("@") || !loginForm.password) {
      setAuthError("Informe um e-mail válido e sua senha.");
      return;
    }
    setBusy(true);
    setAuthError("");
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password: loginForm.password });
      if (error) throw error;
      setLoginForm({ ...emptyLogin });
      setTab("home");
      setScreen("home");
    } catch (error) {
      setAuthError(getErrorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  async function handleSignup() {
    if (!supabase || busy) return;
    const name = signupForm.name.trim();
    const email = signupForm.email.trim().toLowerCase();
    if (!name || name.length > 80 || !email || !email.includes("@")) {
      setAuthError("Informe seu nome (até 80 caracteres) e um e-mail válido.");
      return;
    }
    if (signupForm.password.length < 12) {
      setAuthError("Escolha uma senha com pelo menos 12 caracteres.");
      return;
    }
    if (signupForm.bairro.trim().length > 100 || signupForm.cidade.trim().length > 100) {
      setAuthError("Bairro e cidade devem ter até 100 caracteres.");
      return;
    }
    setBusy(true);
    setAuthError("");
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password: signupForm.password,
        options: {
          data: {
            display_name: name,
            neighborhood: signupForm.bairro.trim() || null,
            city: signupForm.cidade.trim() || null,
          },
        },
      });
      if (error) throw error;
      setSignupForm({ ...emptySignup });
      if (!data.session) {
        setAuthError("Conta criada. Confirme seu e-mail e depois entre na sua conta.");
        setScreen("login");
        return;
      }
      setTab("home");
      setScreen("home");
    } catch (error) {
      setAuthError(getErrorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  function continueAsGuest() {
    setIsGuest(true);
    setTab("home");
    setScreen("home");
  }

  async function logout() {
    if (!supabase || busy) return;
    setBusy(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      setNotice(getErrorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  async function toggleSaved(itemId) {
    if (!requireUser() || busy) return;
    const wasSaved = Boolean(saved[itemId]);
    setBusy(true);
    try {
      await saveFavorite(auth.id, itemId, wasSaved);
      setSaved((current) => ({ ...current, [itemId]: !wasSaved }));
    } catch (error) {
      setNotice(getErrorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  async function openConversation(item, navigate = true) {
    if (!requireUser() || busy) return false;
    setBusy(true);
    try {
      const conversationId = await createOrGetConversation(item);
      setActiveThreadId(conversationId);
      setThreads(await loadConversations(auth.id));
      if (navigate) {
        setTab("messages");
        setScreen("thread");
      }
      return true;
    } catch (error) {
      setNotice(getErrorMessage(error));
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function sendMessage() {
    const content = draftMessage.trim();
    if (!content || !activeThreadId || !auth || busy) return;
    if (content.length > 2000) {
      setNotice("A mensagem pode ter no máximo 2.000 caracteres.");
      return;
    }
    setBusy(true);
    try {
      await sendConversationMessage(activeThreadId, auth.id, content);
      setDraftMessage("");
      setThreads(await loadConversations(auth.id));
    } catch (error) {
      setNotice(getErrorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  async function moderateListing(listingId, status) {
    if (!isAdmin || busy) return;
    setBusy(true);
    try {
      await setListingVisibility(listingId, status);
      const [dashboard, listings] = await Promise.all([loadAdminDashboard(), loadListings()]);
      setAdminDashboard(dashboard);
      setItems(listings);
      setNotice(status === "hidden" ? "Anúncio ocultado." : "Anúncio restaurado.");
    } catch (error) {
      setNotice(getErrorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  function pickImage(file) {
    setFormError("");
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setFormError("Escolha uma imagem JPEG, PNG ou WebP.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setFormError("A imagem deve ter no máximo 5 MB.");
      return;
    }
    setImageAsset({ file, mimeType: file.type, uri: URL.createObjectURL(file) });
  }

  async function submitForm() {
    if (!requireUser() || !supabase || busy) return;
    const title = form.title.trim();
    const description = form.description.trim();
    const neighborhood = form.bairro.trim();
    const city = form.cidade.trim();
    if (title.length < 3 || title.length > 100) {
      setFormError("O título deve ter entre 3 e 100 caracteres.");
      return;
    }
    if (description.length < 10 || description.length > 2000) {
      setFormError("A descrição deve ter entre 10 e 2.000 caracteres.");
      return;
    }
    if (!neighborhood || !city || neighborhood.length > 100 || city.length > 100) {
      setFormError("Informe um bairro e uma cidade com até 100 caracteres.");
      return;
    }

    setBusy(true);
    setFormError("");
    let uploadedPath = null;
    try {
      if (imageAsset) {
        const extensions = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
        const extension = extensions[imageAsset.mimeType];
        if (!extension || !imageAsset.file) {
          throw new Error("Não foi possível ler a imagem selecionada. Tente escolher outra.");
        }
        const targetPath = `${auth.id}/${Date.now()}.${extension}`;
        const { error: uploadError } = await supabase.storage
          .from("listing-images")
          .upload(targetPath, imageAsset.file, { contentType: imageAsset.mimeType, upsert: false });
        if (uploadError) throw uploadError;
        uploadedPath = targetPath;
      }

      const { data, error } = await supabase
        .from("listings")
        .insert({
          owner_id: auth.id,
          title,
          description,
          category: form.category,
          kind: form.tipo,
          neighborhood,
          city,
          image_path: uploadedPath,
        })
        .select("*, profiles!listings_owner_id_fkey(display_name, created_at)")
        .single();
      if (error) throw error;

      const owner = data.profiles;
      const newListing = {
        id: data.id,
        ownerId: data.owner_id,
        title: data.title,
        description: data.description,
        category: data.category,
        tipo: data.kind,
        bairro: data.neighborhood,
        cidade: data.city,
        imagePath: data.image_path,
        imageUrl: data.image_path
          ? supabase.storage.from("listing-images").getPublicUrl(data.image_path).data.publicUrl
          : null,
        dono: owner?.display_name || "Membro",
        membro: owner?.created_at ? `Membro desde ${new Date(owner.created_at).getFullYear()}` : "Membro",
      };
      setItems((current) => [newListing, ...current.filter((item) => item.id !== newListing.id)].slice(0, 100));
      setForm({ ...emptyForm });
      setImageAsset(null);
      setTab("home");
      setScreen("home");
    } catch (error) {
      let message = getErrorMessage(error);
      if (uploadedPath) {
        const { error: cleanupError } = await supabase.storage.from("listing-images").remove([uploadedPath]);
        if (cleanupError) message += ` A imagem enviada não pôde ser removida: ${getErrorMessage(cleanupError)}`;
      }
      setFormError(message);
    } finally {
      setBusy(false);
    }
  }

  if (!isSupabaseConfigured) {
    return <SetupRequired />;
  }

  if (!authReady) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.guestProfileWrap}>
          <Text style={styles.greetingSub}>Conectando ao ReCircula...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={BG} />
      <View style={styles.screenArea}>
        {notice ? (
          <TouchableOpacity style={styles.formError} onPress={() => setNotice("")}>
            <Text style={styles.formErrorText}>{notice} · Toque para fechar</Text>
          </TouchableOpacity>
        ) : null}
        {screen === "splash" && (
          <Splash onStart={() => setScreen(auth || isGuest ? "home" : "login")} />
        )}
        {screen === "login" && (
          <Login
            form={loginForm}
            onChange={(field, value) => {
              setLoginForm((current) => ({ ...current, [field]: value }));
              setAuthError("");
            }}
            onSubmit={handleLogin}
            onGoSignup={() => { setAuthError(""); setScreen("signup"); }}
            onGuest={continueAsGuest}
            error={authError}
          />
        )}
        {screen === "signup" && (
          <Signup
            form={signupForm}
            onChange={(field, value) => {
              setSignupForm((current) => ({ ...current, [field]: value }));
              setAuthError("");
            }}
            onSubmit={handleSignup}
            onGoLogin={() => { setAuthError(""); setScreen("login"); }}
            error={authError}
          />
        )}
        {screen === "home" && (
          <Home
            items={filtered}
            query={query}
            setQuery={setQuery}
            categoryFilter={categoryFilter}
            setCategoryFilter={setCategoryFilter}
            onOpen={openDetail}
          />
        )}
        {screen === "search" && (
          <SearchResults items={filtered} query={query} setQuery={setQuery} onOpen={openDetail} />
        )}
        {screen === "detail" && activeItem && (
          <Detail
            item={activeItem}
            onBack={() => setScreen(tab === "search" ? "search" : "home")}
            interested={Boolean(interested[activeItem.id])}
            onInterest={async () => {
              if (await openConversation(activeItem, false)) {
                setInterested((current) => ({ ...current, [activeItem.id]: true }));
              }
            }}
            saved={Boolean(saved[activeItem.id])}
            toggleSaved={() => toggleSaved(activeItem.id)}
            onGoConversation={() => openConversation(activeItem)}
          />
        )}
        {screen === "create" && (
          <CreateListing
            form={form}
            onChange={handleFormChange}
            onSubmit={submitForm}
            onCancel={() => { setTab("home"); setScreen("home"); }}
            onPickImage={pickImage}
            imageUri={imageAsset?.uri}
            onRemoveImage={() => setImageAsset(null)}
            error={formError}
          />
        )}
        {screen === "messages" && (
          <MessagesList
            threads={threads}
            onOpen={(id) => { setActiveThreadId(id); setScreen("thread"); }}
          />
        )}
        {screen === "thread" && activeThread && (
          <Thread
            thread={activeThread}
            draft={draftMessage}
            setDraft={setDraftMessage}
            onSend={sendMessage}
            onBack={() => setScreen("messages")}
          />
        )}
        {screen === "profile" && (
          <Profile
            auth={profile}
            myItems={myItems}
            savedItems={items.filter((item) => saved[item.id])}
            onOpenItem={openDetail}
            onLogout={logout}
            onGoSignup={() => setScreen("signup")}
          />
        )}
        {screen === "admin" && isAdmin && (
          <AdminDashboard
            dashboard={adminDashboard}
            loading={adminLoading}
            busy={busy}
            onRefresh={async () => {
              setAdminLoading(true);
              try {
                setAdminDashboard(await loadAdminDashboard());
                setNotice("");
              } catch (error) {
                setNotice(getErrorMessage(error));
              } finally {
                setAdminLoading(false);
              }
            }}
            onModerateListing={moderateListing}
          />
        )}
      </View>
      {["home", "search", "create", "messages", "thread", "profile", "admin"].includes(screen) && (
        <BottomNav active={tab} onChange={goTab} isAdmin={isAdmin} />
      )}
    </SafeAreaView>
  );
}

function SetupRequired() {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.guestProfileWrap}>
        <Feather name="settings" size={30} color={GREEN} />
        <Text style={styles.placeholderTitle}>Configure o Supabase</Text>
        <Text style={styles.placeholderBody}>
          Crie um projeto Supabase, configure as variáveis VITE_SUPABASE_URL e
          VITE_SUPABASE_ANON_KEY e aplique a migration em supabase/migrations.
        </Text>
      </View>
    </SafeAreaView>
  );
}

function AdminDashboard({ dashboard, loading, busy, onRefresh, onModerateListing }) {
  const metrics = dashboard?.metrics;
  const metricCards = [
    { label: "Contas", value: metrics?.users ?? 0, icon: "users" },
    { label: "Anúncios ativos", value: metrics?.active_listings ?? 0, icon: "package" },
    { label: "Ocultos", value: metrics?.hidden_listings ?? 0, icon: "eye-off" },
    { label: "Favoritos", value: metrics?.favorites ?? 0, icon: "heart" },
    { label: "Conversas", value: metrics?.conversations ?? 0, icon: "message-circle" },
    { label: "Mensagens", value: metrics?.messages ?? 0, icon: "message-square" },
    { label: "Ações registradas", value: metrics?.activity_events ?? 0, icon: "activity" },
    { label: "Atividade nas últimas 24h", value: metrics?.events_last_24h ?? 0, icon: "clock" },
  ];
  const eventLabels = {
    account_created: "Conta criada",
    listing_created: "Anúncio publicado",
    listing_updated: "Anúncio atualizado",
    listing_removed: "Anúncio removido",
    favorite_added: "Favorito adicionado",
    favorite_removed: "Favorito removido",
    conversation_started: "Conversa iniciada",
    message_sent: "Mensagem enviada",
  };

  return (
    <ScrollView contentContainerStyle={styles.pad} showsVerticalScrollIndicator={false}>
      <View style={styles.adminHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.greeting}>Painel admin</Text>
          <Text style={styles.greetingSub}>Acompanhamento e moderação da comunidade</Text>
        </View>
        <TouchableOpacity
          accessibilityLabel="Atualizar painel admin"
          style={styles.adminRefreshBtn}
          onPress={onRefresh}
          disabled={loading}
        >
          <Feather name="refresh-cw" size={18} color={GREEN} />
        </TouchableOpacity>
      </View>

      <View style={styles.adminPrivacyNote}>
        <Feather name="shield" size={17} color={GREEN} />
        <Text style={styles.adminPrivacyText}>
          Painel restrito. Mensagens privadas não são exibidas; apenas a quantidade e o horário de atividade.
        </Text>
      </View>

      <Text style={styles.sectionLabel}>Visão geral</Text>
      <View style={styles.adminMetricsGrid}>
        {metricCards.map((metric) => (
          <View key={metric.label} style={styles.adminMetricCard}>
            <Feather name={metric.icon} size={16} color="#7C9473" />
            <Text style={styles.adminMetricNumber}>{metric.value.toLocaleString("pt-BR")}</Text>
            <Text style={styles.adminMetricLabel}>{metric.label}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.sectionLabel}>Atividade recente</Text>
      {!dashboard && loading ? (
        <View style={styles.emptyState}><Text style={styles.emptyBody}>Carregando dados administrativos...</Text></View>
      ) : dashboard?.activity?.length ? (
        <View style={styles.adminList}>
          {dashboard.activity.map((event) => (
            <View key={event.id} style={styles.adminActivityRow}>
              <View style={styles.adminActivityIcon}>
                <Feather
                  name={event.event_type === "message_sent" ? "message-circle" : event.event_type.startsWith("listing") ? "package" : "activity"}
                  size={15}
                  color={GREEN}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.adminRowTitle}>{eventLabels[event.event_type] || "Atividade"}</Text>
                <Text style={styles.adminRowBody}>{event.summary}</Text>
                <Text style={styles.adminRowMeta}>
                  {event.actor_name} · {new Date(event.created_at).toLocaleString("pt-BR")}
                </Text>
              </View>
            </View>
          ))}
        </View>
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>Nenhuma atividade registrada</Text>
          <Text style={styles.emptyBody}>Os eventos começarão a aparecer depois desta migration ser aplicada.</Text>
        </View>
      )}

      <Text style={styles.sectionLabel}>Anúncios recentes</Text>
      {dashboard?.listings?.length ? (
        <View style={styles.adminList}>
          {dashboard.listings.map((listing) => (
            <View key={listing.id} style={styles.adminListingRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.adminRowTitle}>{listing.title}</Text>
                <Text style={styles.adminRowBody}>
                  {listing.kind} · {listing.category} · {listing.neighborhood}, {listing.city}
                </Text>
                <Text style={styles.adminRowMeta}>
                  {listing.owner_name} · {new Date(listing.created_at).toLocaleDateString("pt-BR")}
                </Text>
                <Text style={[styles.adminStatus, listing.status === "active" ? styles.adminStatusActive : styles.adminStatusHidden]}>
                  {listing.status === "active" ? "Ativo" : listing.status === "hidden" ? "Oculto" : "Concluído"}
                </Text>
              </View>
              {listing.status !== "completed" && (
                <TouchableOpacity
                  style={styles.adminActionBtn}
                  onPress={() => onModerateListing(listing.id, listing.status === "hidden" ? "active" : "hidden")}
                  disabled={busy}
                >
                  <Text style={styles.adminActionText}>
                    {listing.status === "hidden" ? "Restaurar" : "Ocultar"}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>
      ) : null}

      <Text style={styles.sectionLabel}>Conversas (metadados)</Text>
      {dashboard?.conversations?.length ? (
        <View style={styles.adminList}>
          {dashboard.conversations.map((conversation) => (
            <View key={conversation.id} style={styles.adminSimpleRow}>
              <Text style={styles.adminRowTitle}>{conversation.listing_title}</Text>
              <Text style={styles.adminRowBody}>
                {conversation.requester_name} ↔ {conversation.owner_name}
              </Text>
              <Text style={styles.adminRowMeta}>
                {conversation.message_count} mensagens · última atividade:{" "}
                {conversation.last_message_at
                  ? new Date(conversation.last_message_at).toLocaleString("pt-BR")
                  : "sem mensagens"}
              </Text>
            </View>
          ))}
        </View>
      ) : (
        <View style={styles.emptyState}><Text style={styles.emptyBody}>Nenhuma conversa registrada.</Text></View>
      )}

      <Text style={styles.sectionLabel}>Contas recentes</Text>
      {dashboard?.users?.length ? (
        <View style={styles.adminList}>
          {dashboard.users.map((user) => (
            <View key={user.id} style={styles.adminSimpleRow}>
              <Text style={styles.adminRowTitle}>{user.display_name}</Text>
              <Text style={styles.adminRowBody}>
                {[user.neighborhood, user.city].filter(Boolean).join(", ") || "Local não informado"}
              </Text>
              <Text style={styles.adminRowMeta}>
                Desde {new Date(user.created_at).toLocaleDateString("pt-BR")} · {user.listing_count} anúncios · {user.conversation_count} conversas
              </Text>
            </View>
          ))}
        </View>
      ) : null}
    </ScrollView>
  );
}

function Splash({ onStart }) {
  return (
    <ScrollView contentContainerStyle={styles.splashWrap} showsVerticalScrollIndicator={false}>
      <View style={styles.splashTop}>
        <View style={styles.brandRow}>
          <Feather name="refresh-cw" size={22} color={GREEN} />
          <Text style={styles.brandName}>ReCircula</Text>
        </View>
        <Text style={styles.splashTagline}>Doe, troque, transforme seu bairro</Text>
      </View>

      <View style={styles.illustration}>
        <View style={styles.illCircleA} />
        <View style={styles.illCircleB} />
        <View style={styles.illCircleC} />
      </View>

      <View style={styles.splashBottom}>
        <Text style={styles.splashHeading}>Seja bem-vindo à economia circular local</Text>
        <Text style={styles.splashBody}>
          Encontre uma nova história para o que está parado em casa — ou descubra o que falta no seu bairro.
        </Text>
        <View style={styles.howItWorks}>
          <View style={styles.howStep}>
            <View style={styles.howStepNumber}><Text style={styles.howStepNumberText}>1</Text></View>
            <View style={styles.howStepCopy}>
              <Text style={styles.howStepTitle}>Explore por perto</Text>
              <Text style={styles.howStepBody}>Busque doações e trocas por bairro ou categoria, sem cadastro.</Text>
            </View>
          </View>
          <View style={styles.howStep}>
            <View style={styles.howStepNumber}><Text style={styles.howStepNumberText}>2</Text></View>
            <View style={styles.howStepCopy}>
              <Text style={styles.howStepTitle}>Anuncie o que não usa</Text>
              <Text style={styles.howStepBody}>Publique seu item com uma descrição e combine tudo pelo app.</Text>
            </View>
          </View>
          <View style={styles.howStep}>
            <View style={styles.howStepNumber}><Text style={styles.howStepNumberText}>3</Text></View>
            <View style={styles.howStepCopy}>
              <Text style={styles.howStepTitle}>Converse e combine</Text>
              <Text style={styles.howStepBody}>Fale em particular e combine a retirada diretamente com a pessoa.</Text>
            </View>
          </View>
        </View>
        <TouchableOpacity style={styles.primaryBtn} onPress={onStart}>
          <Text style={styles.primaryBtnText}>Explorar o ReCircula</Text>
        </TouchableOpacity>
        <Text style={styles.splashFootnote}>Você pode explorar sem conta. Para anunciar, salvar favoritos ou conversar, crie uma conta gratuita.</Text>
      </View>
    </ScrollView>
  );
}

function AuthField({ icon, ...props }) {
  return (
    <View style={styles.authFieldWrap}>
      <Feather name={icon} size={16} color={MUTED} style={{ marginRight: 8 }} />
      <TextInput style={styles.authFieldInput} placeholderTextColor="#A8A08D" {...props} />
    </View>
  );
}

function Login({ form, onChange, onSubmit, onGoSignup, onGuest, error }) {
  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.authWrap} showsVerticalScrollIndicator={false}>
        <View style={styles.brandRow}>
          <Feather name="refresh-cw" size={20} color={GREEN} />
          <Text style={styles.brandName}>ReCircula</Text>
        </View>
        <Text style={styles.authTitle}>Bem-vindo de volta</Text>
        <Text style={styles.authSubtitle}>Entre para doar, trocar e conversar com sua vizinhança.</Text>

        <AuthField
          icon="mail"
          placeholder="E-mail"
          keyboardType="email-address"
          autoCapitalize="none"
          value={form.email}
          onChangeText={(v) => onChange("email", v)}
        />
        <AuthField
          icon="lock"
          placeholder="Senha"
          secureTextEntry
          value={form.password}
          onChangeText={(v) => onChange("password", v)}
        />

        {!!error && (
          <View style={styles.formError}>
            <Text style={styles.formErrorText}>{error}</Text>
          </View>
        )}

        <TouchableOpacity style={styles.primaryBtn} onPress={onSubmit}>
          <Text style={styles.primaryBtnText}>Entrar</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.linkBtn} onPress={onGoSignup}>
          <Text style={styles.linkBtnText}>Ainda não tem conta? Criar conta</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.guestBtn} onPress={onGuest}>
          <Text style={styles.guestBtnText}>Continuar sem login</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Signup({ form, onChange, onSubmit, onGoLogin, error }) {
  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.authWrap} showsVerticalScrollIndicator={false}>
        <View style={styles.brandRow}>
          <Feather name="user-plus" size={20} color={GREEN} />
          <Text style={styles.brandName}>Criar conta</Text>
        </View>
        <Text style={styles.authSubtitle}>Leva menos de um minuto.</Text>

        <AuthField
          icon="user"
          placeholder="Nome"
          value={form.name}
          onChangeText={(v) => onChange("name", v)}
        />
        <AuthField
          icon="mail"
          placeholder="E-mail"
          keyboardType="email-address"
          autoCapitalize="none"
          value={form.email}
          onChangeText={(v) => onChange("email", v)}
        />
        <AuthField
          icon="lock"
          placeholder="Senha"
          secureTextEntry
          value={form.password}
          onChangeText={(v) => onChange("password", v)}
        />
        <View style={{ flexDirection: "row", gap: 10 }}>
          <View style={{ flex: 1 }}>
            <AuthField
              icon="map-pin"
              placeholder="Bairro"
              value={form.bairro}
              onChangeText={(v) => onChange("bairro", v)}
            />
          </View>
          <View style={{ flex: 1 }}>
            <AuthField
              icon="map"
              placeholder="Cidade"
              value={form.cidade}
              onChangeText={(v) => onChange("cidade", v)}
            />
          </View>
        </View>

        {!!error && (
          <View style={styles.formError}>
            <Text style={styles.formErrorText}>{error}</Text>
          </View>
        )}

        <TouchableOpacity style={styles.primaryBtn} onPress={onSubmit}>
          <Text style={styles.primaryBtnText}>Criar conta</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.linkBtn} onPress={onGoLogin}>
          <Text style={styles.linkBtnText}>Já tem conta? Entrar</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function SearchBar({ query, setQuery, placeholder }) {
  return (
    <View style={styles.searchBox}>
      <Feather name="search" size={16} color={MUTED} />
      <TextInput
        style={styles.searchInput}
        placeholder={placeholder || "Buscar por bairro ou cidade..."}
        placeholderTextColor="#A8A08D"
        value={query}
        onChangeText={setQuery}
      />
      {query.length > 0 && (
        <TouchableOpacity onPress={() => setQuery("")}>
          <Feather name="x" size={14} color={MUTED} />
        </TouchableOpacity>
      )}
    </View>
  );
}

function Chip({ active, label, onPress }) {
  return (
    <TouchableOpacity style={[styles.chip, active && styles.chipActive]} onPress={onPress}>
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

function TipoTag({ tipo, floating }) {
  return (
    <View style={[styles.tipoTag, tipo === "Doação" ? styles.tagDoacao : styles.tagTroca, floating]}>
      <Text style={[styles.tipoTagText, { color: tipo === "Doação" ? "#2F5233" : "#8A5A24" }]}>{tipo}</Text>
    </View>
  );
}

function Home({ items, query, setQuery, categoryFilter, setCategoryFilter, onOpen }) {
  return (
    <ScrollView contentContainerStyle={styles.pad} showsVerticalScrollIndicator={false}>
      <Text style={styles.greeting}>Olá! 👋</Text>
      <Text style={styles.greetingSub}>Encontre itens perto de você</Text>

      <SearchBar query={query} setQuery={setQuery} />

      <View style={styles.chipRow}>
        <Chip active={categoryFilter === null} label="Todas" onPress={() => setCategoryFilter(null)} />
        {CATEGORIES.map((c) => (
          <Chip
            key={c.id}
            active={categoryFilter === c.id}
            label={c.label}
            onPress={() => setCategoryFilter(categoryFilter === c.id ? null : c.id)}
          />
        ))}
      </View>

      {items.length === 0 ? (
        <EmptyState />
      ) : (
        <View style={styles.grid2}>
          {items.map((it) => (
            <ItemCard key={it.id} item={it} onOpen={() => onOpen(it.id)} />
          ))}
        </View>
      )}
    </ScrollView>
  );
}

function SearchResults({ items, query, setQuery, onOpen }) {
  const label = query.trim() || null;
  return (
    <ScrollView contentContainerStyle={styles.pad} showsVerticalScrollIndicator={false}>
      <SearchBar query={query} setQuery={setQuery} placeholder="Pinheiros" />
      <Text style={styles.resultsCount}>
        {items.length} {items.length === 1 ? "item encontrado" : "itens encontrados"}
        {label ? ` em ${label}` : ""}
      </Text>

      {items.length === 0 ? (
        <EmptyState />
      ) : (
        <View style={{ gap: 10 }}>
          {items.map((it) => (
            <ListRow key={it.id} item={it} onOpen={() => onOpen(it.id)} />
          ))}
        </View>
      )}
    </ScrollView>
  );
}

function ItemCard({ item, onOpen }) {
  return (
    <TouchableOpacity style={styles.card} onPress={onOpen}>
      <View style={styles.cardImage}>
        {item.imageUrl ? (
          <Image source={{ uri: item.imageUrl }} style={styles.cardImageAsset} />
        ) : (
          <Feather name={categoryIcon(item.category)} size={30} color="#7C9473" />
        )}
        <TipoTag tipo={item.tipo} floating={styles.tagFloatingCard} />
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
        <View style={styles.cardLoc}>
          <Feather name="map-pin" size={11} color={MUTED} />
          <Text style={styles.cardLocText}>{item.bairro}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

function ListRow({ item, onOpen }) {
  return (
    <TouchableOpacity style={styles.listRow} onPress={onOpen}>
      <View style={styles.listThumb}>
        {item.imageUrl ? (
          <Image source={{ uri: item.imageUrl }} style={styles.listThumbAsset} />
        ) : (
          <Feather name={categoryIcon(item.category)} size={22} color="#7C9473" />
        )}
      </View>
      <View style={{ flex: 1 }}>
        <View style={styles.listTop}>
          <Text style={styles.listTitle} numberOfLines={1}>{item.title}</Text>
          <TipoTag tipo={item.tipo} />
        </View>
        <View style={styles.cardLoc}>
          <Feather name="map-pin" size={11} color={MUTED} />
          <Text style={styles.cardLocText}>{item.bairro}, {item.cidade}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

function EmptyState() {
  return (
    <View style={styles.emptyState}>
      <Text style={styles.emptyTitle}>Nada por aqui ainda</Text>
      <Text style={styles.emptyBody}>Tente buscar por outro bairro ou cidade.</Text>
    </View>
  );
}

function Detail({ item, isOwner, onBack, interested, onInterest, saved, toggleSaved, onGoConversation }) {
  return (
    <ScrollView contentContainerStyle={{ paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
      <View style={styles.detailImage}>
        {item.imageUrl ? <Image source={{ uri: item.imageUrl }} style={styles.detailImageAsset} /> : null}
        <TouchableOpacity style={[styles.iconBtnLight, { left: 14 }]} onPress={onBack}>
          <Feather name="arrow-left" size={18} color={TEXT} />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.iconBtnLight, { right: 14 }]} onPress={toggleSaved}>
          <Feather name="bookmark" size={18} color={saved ? GREEN : TEXT} />
        </TouchableOpacity>
        {!item.imageUrl && <Feather name={categoryIcon(item.category)} size={64} color="#7C9473" />}
        <TipoTag tipo={item.tipo} floating={styles.tagFloatingDetail} />
      </View>

      <View style={styles.pad}>
        <Text style={styles.detailTitle}>{item.title}</Text>
        <View style={styles.cardLoc}>
          <Feather name="map-pin" size={13} color="#7C9473" />
          <Text style={[styles.cardLocText, { fontSize: 13 }]}>{item.bairro}, {item.cidade}</Text>
        </View>

        <Text style={styles.sectionLabel}>Descrição</Text>
        <Text style={styles.detailDesc}>{item.description}</Text>

        <View style={styles.ownerRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials(item.dono)}</Text>
          </View>
          <View>
            <Text style={styles.ownerName}>{item.dono}</Text>
            <Text style={styles.ownerMeta}>{item.membro}</Text>
          </View>
        </View>

        {isOwner ? (
          <View style={styles.interestedBox}>
            <Text style={styles.interestedText}>Este anúncio pertence à sua conta.</Text>
          </View>
        ) : interested ? (
          <View style={styles.interestedBox}>
            <Feather name="check" size={16} color="#2F5233" />
            <Text style={styles.interestedText}>
              Interesse enviado! {item.dono.split(" ")[0]} vai receber seu contato.
            </Text>
          </View>
        ) : (
          <TouchableOpacity style={styles.primaryBtn} onPress={onInterest}>
            <Text style={styles.primaryBtnText}>Tenho Interesse</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.outlineBtn} onPress={onGoConversation}>
          <Feather name="message-circle" size={15} color={GREEN} />
          <Text style={styles.outlineBtnText}>Enviar mensagem</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

function CreateListing({ form, onChange, onSubmit, onCancel, onPickImage, imageUri, onRemoveImage, error }) {
  const imageInputRef = useRef(null);

  return (
    <ScrollView contentContainerStyle={styles.pad} showsVerticalScrollIndicator={false}>
      <View style={styles.createHeader}>
        <Text style={styles.createTitle}>Novo Anúncio</Text>
        <TouchableOpacity onPress={onCancel}>
          <Text style={styles.cancelLink}>Cancelar</Text>
        </TouchableOpacity>
      </View>

      <input
        ref={imageInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        hidden
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) onPickImage(file);
          event.target.value = "";
        }}
      />
      <TouchableOpacity style={styles.photoBox} onPress={() => imageInputRef.current?.click()}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.imagePreview} />
        ) : (
          <>
            <Feather name="camera" size={22} color="#7C9473" />
            <Text style={styles.photoText}>Adicionar uma foto (máximo 5 MB)</Text>
          </>
        )}
      </TouchableOpacity>
      {imageUri ? (
        <TouchableOpacity onPress={onRemoveImage}>
          <Text style={styles.cancelLink}>Remover foto</Text>
        </TouchableOpacity>
      ) : null}

      <Text style={styles.label}>Título</Text>
      <TextInput
        style={styles.input}
        placeholder="Ex: Bicicleta aro 26, 2 anos"
        placeholderTextColor="#A8A08D"
        value={form.title}
        maxLength={100}
        onChangeText={(v) => onChange("title", v)}
      />

      <Text style={styles.label}>Descrição</Text>
      <TextInput
        style={[styles.input, styles.textarea]}
        placeholder="Descreva o item e as condições de retirada..."
        placeholderTextColor="#A8A08D"
        value={form.description}
        maxLength={2000}
        onChangeText={(v) => onChange("description", v)}
        multiline
        numberOfLines={3}
      />

      <Text style={styles.label}>Categoria</Text>
      <View style={styles.toggleRow}>
        {CATEGORIES.map((c) => (
          <TouchableOpacity
            key={c.id}
            style={[styles.catBtn, form.category === c.id && styles.toggleActive]}
            onPress={() => onChange("category", c.id)}
          >
            <Text style={[styles.toggleBtnText, form.category === c.id && styles.toggleActiveText]}>
              {c.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Tipo de Publicação</Text>
      <View style={styles.toggleRow}>
        <TouchableOpacity
          style={[styles.toggleBtn, form.tipo === "Doação" && styles.toggleActive]}
          onPress={() => onChange("tipo", "Doação")}
        >
          <Text style={[styles.toggleBtnText, form.tipo === "Doação" && styles.toggleActiveText]}>Doação</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleBtn, form.tipo === "Troca" && styles.toggleActive]}
          onPress={() => onChange("tipo", "Troca")}
        >
          <Text style={[styles.toggleBtnText, form.tipo === "Troca" && styles.toggleActiveText]}>Troca</Text>
        </TouchableOpacity>
      </View>

      <View style={{ flexDirection: "row", gap: 12 }}>
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>Bairro</Text>
          <TextInput
            style={styles.input}
            placeholder="Pinheiros"
            placeholderTextColor="#A8A08D"
            value={form.bairro}
            onChangeText={(v) => onChange("bairro", v)}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>Cidade</Text>
          <TextInput
            style={styles.input}
            placeholder="São Paulo"
            placeholderTextColor="#A8A08D"
            value={form.cidade}
            onChangeText={(v) => onChange("cidade", v)}
          />
        </View>
      </View>

      {!!error && (
        <View style={styles.formError}>
          <Text style={styles.formErrorText}>{error}</Text>
        </View>
      )}

      <TouchableOpacity style={styles.primaryBtn} onPress={onSubmit}>
        <Text style={styles.primaryBtnText}>Publicar Anúncio</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function MessagesList({ threads, onOpen }) {
  return (
    <ScrollView contentContainerStyle={styles.pad} showsVerticalScrollIndicator={false}>
      <Text style={styles.greeting}>Mensagens</Text>
      <Text style={styles.greetingSub}>Conversas sobre seus interesses e anúncios</Text>

      {threads.length === 0 ? (
        <View style={[styles.emptyState, { marginTop: 16 }]}>
          <Text style={styles.emptyTitle}>Nenhuma conversa ainda</Text>
          <Text style={styles.emptyBody}>Toque em "Tenho Interesse" num item para começar a conversar.</Text>
        </View>
      ) : (
        <View style={{ gap: 10, marginTop: 16 }}>
          {threads.map((t) => {
            const last = t.messages[t.messages.length - 1];
            return (
              <TouchableOpacity key={t.id} style={styles.threadRow} onPress={() => onOpen(t.id)}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{initials(t.contato)}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.listTop}>
                    <Text style={styles.listTitle} numberOfLines={1}>{t.contato}</Text>
                  </View>
                  <Text style={styles.threadItemLabel} numberOfLines={1}>{t.itemTitle}</Text>
                  <Text style={styles.threadPreview} numberOfLines={1}>
                    {last.from === "me" ? "Você: " : ""}{last.text}
                  </Text>
                </View>
                <Feather name="chevron-right" size={18} color={MUTED} />
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}

function Thread({ thread, draft, setDraft, onSend, onBack }) {
  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
      <View style={styles.threadHeader}>
        <TouchableOpacity onPress={onBack} style={{ marginRight: 10 }}>
          <Feather name="arrow-left" size={18} color={TEXT} />
        </TouchableOpacity>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials(thread.contato)}</Text>
        </View>
        <View style={{ marginLeft: 10 }}>
          <Text style={styles.listTitle}>{thread.contato}</Text>
          <Text style={styles.threadItemLabel}>{thread.itemTitle}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 8 }} showsVerticalScrollIndicator={false}>
        {thread.messages.map((m) => (
          <View
            key={m.id}
            style={[styles.bubble, m.from === "me" ? styles.bubbleMe : styles.bubbleThem]}
          >
            <Text style={[styles.bubbleText, m.from === "me" && { color: BG }]}>{m.text}</Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.threadInputRow}>
        <TextInput
          style={styles.threadInput}
          placeholder="Escreva uma mensagem..."
          placeholderTextColor="#A8A08D"
          value={draft}
          onChangeText={setDraft}
          multiline
        />
        <TouchableOpacity style={styles.sendBtn} onPress={onSend}>
          <Feather name="send" size={17} color={BG} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

function SettingsRow({ icon, label, onPress, danger }) {
  return (
    <TouchableOpacity style={styles.settingsRow} onPress={onPress}>
      <Feather name={icon} size={17} color={danger ? "#B5533C" : "#5A5646"} />
      <Text style={[styles.settingsLabel, danger && { color: "#B5533C" }]}>{label}</Text>
      {!danger && <Feather name="chevron-right" size={16} color={MUTED} style={{ marginLeft: "auto" }} />}
    </TouchableOpacity>
  );
}

function Profile({ auth, myItems, savedItems, onOpenItem, onLogout, onGoSignup }) {
  if (!auth || auth.guest) {
    return (
      <View style={styles.guestProfileWrap}>
        <Feather name="user" size={30} color="#7C9473" />
        <Text style={styles.placeholderTitle}>Você está como convidado</Text>
        <Text style={styles.placeholderBody}>
          Crie uma conta para anunciar itens com seu nome, salvar favoritos e ver suas conversas.
        </Text>
        <TouchableOpacity style={[styles.primaryBtn, { marginTop: 14, width: "100%" }]} onPress={onGoSignup}>
          <Text style={styles.primaryBtnText}>Criar conta</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.pad} showsVerticalScrollIndicator={false}>
      <View style={styles.profileHeader}>
        <View style={styles.avatarLg}>
          <Text style={styles.avatarLgText}>{initials(auth.name)}</Text>
        </View>
        <Text style={styles.profileName}>{auth.name}</Text>
        <Text style={styles.profileMeta}>
          <Feather name="map-pin" size={11} color={MUTED} /> {auth.bairro}, {auth.cidade}
        </Text>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{myItems.length}</Text>
          <Text style={styles.statLabel}>Anúncios</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{myItems.filter((i) => i.tipo === "Doação").length}</Text>
          <Text style={styles.statLabel}>Doações</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{myItems.filter((i) => i.tipo === "Troca").length}</Text>
          <Text style={styles.statLabel}>Trocas</Text>
        </View>
      </View>

      <Text style={styles.sectionLabel}>Meus Anúncios</Text>
      {myItems.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>Você ainda não anunciou nada</Text>
          <Text style={styles.emptyBody}>Toque no botão "+" para publicar seu primeiro item.</Text>
        </View>
      ) : (
        <View style={{ gap: 10, marginBottom: 6 }}>
          {myItems.map((it) => (
            <ListRow key={it.id} item={it} onOpen={() => onOpenItem(it.id)} />
          ))}
        </View>
      )}

      <Text style={[styles.sectionLabel, { marginTop: 20 }]}>Favoritos</Text>
      {savedItems.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>Nenhum favorito salvo</Text>
          <Text style={styles.emptyBody}>Toque no marcador de um anúncio para salvá-lo aqui.</Text>
        </View>
      ) : (
        <View style={{ gap: 10, marginBottom: 6 }}>
          {savedItems.map((item) => (
            <ListRow key={item.id} item={item} onOpen={() => onOpenItem(item.id)} />
          ))}
        </View>
      )}

      <Text style={[styles.sectionLabel, { marginTop: 20 }]}>Configurações</Text>
      <View style={styles.settingsCard}>
        <SettingsRow icon="log-out" label="Sair da conta" onPress={onLogout} danger />
      </View>
    </ScrollView>
  );
}

function BottomNav({ active, onChange, isAdmin }) {
  const navItems = [
    { id: "home", icon: "home", label: "Início" },
    { id: "search", icon: "search", label: "Busca" },
    { id: "create", icon: "plus", label: "Anunciar", elevated: true },
    { id: "messages", icon: "message-circle", label: "Mensagens" },
    { id: "profile", icon: "user", label: "Perfil" },
    ...(isAdmin ? [{ id: "admin", icon: "shield", label: "Admin" }] : []),
  ];
  return (
    <View style={styles.bottomNav}>
      {navItems.map((it) => {
        const isActive = active === it.id;
        if (it.elevated) {
          return (
            <TouchableOpacity key={it.id} style={styles.navElevated} onPress={() => onChange(it.id)}>
              <Feather name="plus" size={22} color={BG} />
            </TouchableOpacity>
          );
        }
        return (
          <TouchableOpacity key={it.id} style={styles.navItem} onPress={() => onChange(it.id)}>
            <Feather name={it.icon} size={20} color={isActive ? GREEN : "#A8A08D"} />
            <Text style={[styles.navLabel, { color: isActive ? GREEN : "#A8A08D" }]}>{it.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  screenArea: { flex: 1, width: "100%", maxWidth: 560, alignSelf: "center" },
  pad: { padding: 18, paddingBottom: 30 },
  splashWrap: { flexGrow: 1, padding: 22, justifyContent: "space-between" },
  splashTop: { alignItems: "center", marginTop: 10 },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 7 },
  brandName: { fontSize: 24, fontWeight: "700", color: GREEN, marginLeft: 7 },
  splashTagline: { fontSize: 13, color: "#6B6552", marginTop: 4 },
  illustration: { flex: 1, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 10 },
  illCircleA: { width: 70, height: 70, borderRadius: 35, backgroundColor: "#8FAE7C" },
  illCircleB: { width: 90, height: 90, borderRadius: 45, backgroundColor: "#7C9473" },
  illCircleC: { width: 60, height: 60, borderRadius: 30, backgroundColor: "#C97D4E" },
  splashBottom: { paddingBottom: 10 },
  splashHeading: { fontSize: 20, fontWeight: "700", color: GREEN_DARK, marginBottom: 10, lineHeight: 27 },
  splashBody: { fontSize: 13.5, color: "#6B6552", lineHeight: 20, marginBottom: 18 },
  howItWorks: { gap: 10, marginBottom: 18 },
  howStep: {
    flexDirection: "row", alignItems: "center", gap: 11, padding: 11,
    backgroundColor: CARD_BG, borderWidth: 1, borderColor: BORDER, borderRadius: 12,
  },
  howStepNumber: {
    width: 28, height: 28, borderRadius: 14, backgroundColor: "#DCEBCB",
    alignItems: "center", justifyContent: "center",
  },
  howStepNumberText: { color: GREEN, fontSize: 13, fontWeight: "700" },
  howStepCopy: { flex: 1 },
  howStepTitle: { color: GREEN_DARK, fontSize: 12.5, fontWeight: "700" },
  howStepBody: { color: "#6B6552", fontSize: 11.5, lineHeight: 16, marginTop: 2 },
  splashFootnote: { color: MUTED, fontSize: 11, lineHeight: 16, textAlign: "center", marginTop: 2 },

  authWrap: { padding: 22, paddingTop: 40, paddingBottom: 40 },
  authTitle: { fontSize: 21, fontWeight: "700", color: GREEN_DARK, marginTop: 18 },
  authSubtitle: { fontSize: 13, color: "#6B6552", marginTop: 5, marginBottom: 20, lineHeight: 19 },
  authFieldWrap: {
    flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: BORDER,
    borderRadius: 10, paddingHorizontal: 12, backgroundColor: CARD_BG, marginBottom: 12,
  },
  authFieldInput: { flex: 1, paddingVertical: 12, fontSize: 13.5, color: TEXT },
  linkBtn: { alignItems: "center", marginTop: 14 },
  linkBtnText: { color: GREEN, fontSize: 13, fontWeight: "700" },
  guestBtn: { alignItems: "center", marginTop: 8 },
  guestBtnText: { color: MUTED, fontSize: 12.5, fontWeight: "600" },

  greeting: { fontSize: 24, fontWeight: "700", color: GREEN_DARK },
  greetingSub: { fontSize: 13.5, color: "#6B6552", marginTop: 3, marginBottom: 14 },
  adminHeader: { flexDirection: "row", alignItems: "center", marginBottom: 4 },
  adminRefreshBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: CARD_BG,
    borderWidth: 1, borderColor: BORDER, alignItems: "center", justifyContent: "center",
  },
  adminPrivacyNote: {
    flexDirection: "row", alignItems: "center", gap: 9, backgroundColor: "#DCEBCB",
    borderWidth: 1, borderColor: "#B9D89E", borderRadius: 10, padding: 11, marginBottom: 4,
  },
  adminPrivacyText: { flex: 1, color: GREEN_DARK, fontSize: 11.5, lineHeight: 16 },
  adminMetricsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  adminMetricCard: {
    width: "48%", flexGrow: 1, minWidth: "42%", backgroundColor: CARD_BG,
    borderWidth: 1, borderColor: BORDER, borderRadius: 12, padding: 12,
  },
  adminMetricNumber: { color: GREEN_DARK, fontSize: 21, fontWeight: "700", marginTop: 5 },
  adminMetricLabel: { color: MUTED, fontSize: 11, marginTop: 2 },
  adminList: { gap: 8 },
  adminActivityRow: {
    flexDirection: "row", alignItems: "flex-start", gap: 10, backgroundColor: CARD_BG,
    borderWidth: 1, borderColor: BORDER, borderRadius: 12, padding: 11,
  },
  adminActivityIcon: {
    width: 30, height: 30, borderRadius: 15, backgroundColor: "#DCEBCB",
    alignItems: "center", justifyContent: "center",
  },
  adminListingRow: {
    flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: CARD_BG,
    borderWidth: 1, borderColor: BORDER, borderRadius: 12, padding: 11,
  },
  adminSimpleRow: {
    backgroundColor: CARD_BG, borderWidth: 1, borderColor: BORDER, borderRadius: 12, padding: 11,
  },
  adminRowTitle: { color: GREEN_DARK, fontSize: 12.5, fontWeight: "700" },
  adminRowBody: { color: "#5A5646", fontSize: 11.5, lineHeight: 16, marginTop: 3 },
  adminRowMeta: { color: MUTED, fontSize: 10.5, lineHeight: 15, marginTop: 4 },
  adminStatus: { alignSelf: "flex-start", borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3, marginTop: 6, fontSize: 10, fontWeight: "700" },
  adminStatusActive: { color: GREEN, backgroundColor: "#DCEBCB" },
  adminStatusHidden: { color: "#8A5A24", backgroundColor: "#F7DFC0" },
  adminActionBtn: { borderWidth: 1, borderColor: GREEN, borderRadius: 9, paddingHorizontal: 10, paddingVertical: 8 },
  adminActionText: { color: GREEN, fontSize: 11, fontWeight: "700" },
  searchBox: {
    flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: CARD_BG,
    borderWidth: 1, borderColor: BORDER, borderRadius: 12, paddingHorizontal: 13, paddingVertical: 10,
  },
  searchInput: { flex: 1, fontSize: 14, color: TEXT },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 7, marginTop: 14, marginBottom: 16 },
  chip: { backgroundColor: CARD_BG, borderWidth: 1, borderColor: BORDER, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7 },
  chipActive: { backgroundColor: GREEN, borderColor: GREEN },
  chipText: { fontSize: 12.5, fontWeight: "600", color: "#5A5646" },
  chipTextActive: { color: BG },
  resultsCount: { fontSize: 12, color: MUTED, marginTop: 14, marginBottom: 12 },
  grid2: { flexDirection: "row", flexWrap: "wrap", gap: 12, justifyContent: "space-between" },
  card: {
    width: "48%", backgroundColor: CARD_BG, borderWidth: 1, borderColor: BORDER,
    borderRadius: 14, overflow: "hidden", marginBottom: 4,
  },
  cardImage: { height: 90, backgroundColor: "#EAE4D1", alignItems: "center", justifyContent: "center" },
  cardImageAsset: { width: "100%", height: "100%", resizeMode: "cover" },
  cardBody: { padding: 10 },
  cardTitle: { fontSize: 12.5, fontWeight: "700", color: GREEN_DARK, lineHeight: 16 },
  cardLoc: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 5 },
  cardLocText: { fontSize: 11, color: MUTED, fontWeight: "500" },
  tipoTag: { position: "absolute", paddingHorizontal: 9, paddingVertical: 3, borderRadius: 20 },
  tagFloatingCard: { top: 8, right: 8, position: "absolute" },
  tagFloatingDetail: { bottom: 14, left: 16, position: "absolute" },
  tagDoacao: { backgroundColor: "#DCEBCB" },
  tagTroca: { backgroundColor: "#F7DFC0" },
  tipoTagText: { fontSize: 10, fontWeight: "700" },
  listRow: {
    flexDirection: "row", gap: 12, alignItems: "center", backgroundColor: CARD_BG,
    borderWidth: 1, borderColor: BORDER, borderRadius: 14, padding: 10,
  },
  listThumb: { width: 56, height: 56, borderRadius: 10, backgroundColor: "#EAE4D1", alignItems: "center", justifyContent: "center", overflow: "hidden" },
  listThumbAsset: { width: "100%", height: "100%", resizeMode: "cover" },
  listTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 6 },
  listTitle: { fontSize: 13, fontWeight: "700", color: GREEN_DARK, flex: 1 },
  emptyState: { alignItems: "center", padding: 40, backgroundColor: CARD_BG, borderWidth: 1, borderColor: BORDER, borderRadius: 14, borderStyle: "dashed" },
  emptyTitle: { fontSize: 15, fontWeight: "700", color: GREEN_DARK, marginBottom: 5 },
  emptyBody: { fontSize: 12, color: "#6B6552", textAlign: "center" },
  detailImage: {
    height: 220, backgroundColor: "#EAE4D1", alignItems: "center", justifyContent: "center",
  },
  detailImageAsset: { position: "absolute", width: "100%", height: "100%", resizeMode: "cover" },
  iconBtnLight: {
    position: "absolute", top: 14, width: 34, height: 34, borderRadius: 17,
    backgroundColor: "rgba(255,254,251,0.92)", alignItems: "center", justifyContent: "center",
  },
  detailTitle: { fontSize: 20, fontWeight: "700", color: GREEN_DARK, marginTop: 12, marginBottom: 6, lineHeight: 26 },
  sectionLabel: { fontSize: 12.5, fontWeight: "700", color: GREEN_DARK, marginTop: 18, marginBottom: 8 },
  detailDesc: { fontSize: 13, color: "#4A473D", lineHeight: 21 },
  ownerRow: {
    flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 16,
    borderTopWidth: 1, borderBottomWidth: 1, borderColor: BORDER, marginVertical: 18,
  },
  avatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: GREEN, alignItems: "center", justifyContent: "center" },
  avatarText: { color: BG, fontWeight: "700", fontSize: 14 },
  ownerName: { fontSize: 13.5, fontWeight: "700", color: TEXT },
  ownerMeta: { fontSize: 11.5, color: MUTED, marginTop: 2 },
  interestedBox: {
    flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#DCEBCB",
    borderWidth: 1, borderColor: "#B9D89E", borderRadius: 10, padding: 14, marginBottom: 10,
  },
  interestedText: { fontSize: 12.5, fontWeight: "600", color: GREEN, flex: 1 },
  primaryBtn: { backgroundColor: GREEN, borderRadius: 12, paddingVertical: 13, alignItems: "center", marginBottom: 10 },
  primaryBtnText: { color: BG, fontSize: 14, fontWeight: "700" },
  outlineBtn: {
    borderWidth: 1.5, borderColor: GREEN, borderRadius: 12, paddingVertical: 12,
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7,
  },
  outlineBtnText: { color: GREEN, fontSize: 13.5, fontWeight: "700" },
  createHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  createTitle: { fontSize: 20, fontWeight: "700", color: GREEN_DARK },
  cancelLink: { color: MUTED, fontSize: 13, fontWeight: "600" },
  photoBox: {
    borderWidth: 1.5, borderColor: "#C9C2A8", borderStyle: "dashed", borderRadius: 12,
    paddingVertical: 22, alignItems: "center", gap: 6, backgroundColor: "#FBF9F1", marginBottom: 14,
  },
  imagePreview: { width: "100%", height: 190, borderRadius: 10, resizeMode: "cover" },
  photoText: { fontSize: 12.5, color: "#7C9473", fontWeight: "600" },
  label: { fontSize: 12, fontWeight: "700", color: "#5A5646", marginBottom: 6, marginTop: 2 },
  input: {
    borderWidth: 1, borderColor: BORDER, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10,
    fontSize: 13.5, color: TEXT, backgroundColor: CARD_BG, marginBottom: 14,
  },
  textarea: { height: 80, textAlignVertical: "top" },
  toggleRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 14 },
  toggleBtn: { flex: 1, paddingVertical: 10, borderRadius: 20, borderWidth: 1, borderColor: BORDER, backgroundColor: CARD_BG, alignItems: "center" },
  catBtn: { paddingVertical: 9, paddingHorizontal: 13, borderRadius: 20, borderWidth: 1, borderColor: BORDER, backgroundColor: CARD_BG },
  toggleBtnText: { fontSize: 12.5, fontWeight: "700", color: "#5A5646" },
  toggleActive: { backgroundColor: "#DCEBCB", borderColor: GREEN },
  toggleActiveText: { color: GREEN },
  formError: { backgroundColor: "#FAECE7", borderWidth: 1, borderColor: "#F0997B", borderRadius: 8, padding: 11, marginBottom: 14 },
  formErrorText: { color: "#993C1D", fontSize: 12 },

  threadRow: {
    flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: CARD_BG,
    borderWidth: 1, borderColor: BORDER, borderRadius: 14, padding: 12,
  },
  threadItemLabel: { fontSize: 11.5, color: "#7C9473", fontWeight: "600", marginTop: 1 },
  threadPreview: { fontSize: 12, color: MUTED, marginTop: 3 },
  threadHeader: {
    flexDirection: "row", alignItems: "center", padding: 16,
    borderBottomWidth: 1, borderColor: BORDER, backgroundColor: CARD_BG,
  },
  bubble: { maxWidth: "78%", borderRadius: 14, paddingHorizontal: 13, paddingVertical: 9 },
  bubbleThem: { backgroundColor: CARD_BG, borderWidth: 1, borderColor: BORDER, alignSelf: "flex-start" },
  bubbleMe: { backgroundColor: GREEN, alignSelf: "flex-end" },
  bubbleText: { fontSize: 13, color: TEXT, lineHeight: 19 },
  threadInputRow: {
    flexDirection: "row", alignItems: "flex-end", gap: 8, padding: 12,
    borderTopWidth: 1, borderColor: BORDER, backgroundColor: CARD_BG,
  },
  threadInput: {
    flex: 1, borderWidth: 1, borderColor: BORDER, borderRadius: 18, paddingHorizontal: 14,
    paddingVertical: 10, fontSize: 13.5, color: TEXT, maxHeight: 90, backgroundColor: BG,
  },
  sendBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: GREEN, alignItems: "center", justifyContent: "center" },

  guestProfileWrap: { flex: 1, alignItems: "center", justifyContent: "center", padding: 30 },
  profileHeader: { alignItems: "center", marginBottom: 16 },
  avatarLg: { width: 68, height: 68, borderRadius: 34, backgroundColor: GREEN, alignItems: "center", justifyContent: "center", marginBottom: 10 },
  avatarLgText: { color: BG, fontWeight: "700", fontSize: 24 },
  profileName: { fontSize: 18, fontWeight: "700", color: GREEN_DARK },
  profileMeta: { fontSize: 12.5, color: MUTED, marginTop: 3 },
  statsRow: { flexDirection: "row", gap: 10, marginBottom: 6 },
  statBox: {
    flex: 1, backgroundColor: CARD_BG, borderWidth: 1, borderColor: BORDER,
    borderRadius: 12, alignItems: "center", paddingVertical: 12,
  },
  statNumber: { fontSize: 17, fontWeight: "700", color: GREEN_DARK },
  statLabel: { fontSize: 11, color: MUTED, marginTop: 2 },
  settingsCard: { backgroundColor: CARD_BG, borderWidth: 1, borderColor: BORDER, borderRadius: 14, overflow: "hidden" },
  settingsRow: {
    flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 14,
    paddingHorizontal: 14, borderBottomWidth: 1, borderColor: BORDER,
  },
  settingsLabel: { fontSize: 13.5, color: TEXT, fontWeight: "600" },

  placeholderTitle: { fontSize: 16, fontWeight: "700", color: GREEN_DARK, marginTop: 10 },
  placeholderBody: { fontSize: 12.5, color: MUTED, textAlign: "center", marginTop: 4, lineHeight: 18 },

  bottomNav: {
    flexDirection: "row", justifyContent: "space-around", alignItems: "center",
    width: "100%", maxWidth: 560, alignSelf: "center", paddingVertical: 10,
    backgroundColor: CARD_BG, borderTopWidth: 1, borderColor: BORDER,
  },
  navItem: { alignItems: "center", gap: 3, paddingHorizontal: 6, paddingVertical: 4 },
  navLabel: { fontSize: 9.5, fontWeight: "600" },
  navElevated: {
    width: 48, height: 48, borderRadius: 24, backgroundColor: GREEN, alignItems: "center",
    justifyContent: "center", marginTop: -24,
  },
});
