import { useEffect, useState } from "react";
import { Layout } from "./components/Layout";
import { currentRoute } from "./lib/route";
import { DashboardPage } from "./pages/DashboardPage";
import { KnowledgePage } from "./pages/KnowledgePage";
import { MessageDetailPage } from "./pages/MessageDetailPage";
import { MessagesPage } from "./pages/MessagesPage";
import { RepliesPage } from "./pages/RepliesPage";
import { ReplyDetailPage } from "./pages/ReplyDetailPage";
import { RunsPage } from "./pages/RunsPage";
import { SettingsPage } from "./pages/SettingsPage";
import { TodoDetailPage } from "./pages/TodoDetailPage";
import { TodosPage } from "./pages/TodosPage";

function render(path: string) {
  const parts = path.split("/").filter(Boolean);
  if (path === "/") return <DashboardPage />;
  if (parts[0] === "messages" && parts[1]) return <MessageDetailPage id={parts[1]} />;
  if (parts[0] === "messages") return <MessagesPage />;
  if (parts[0] === "todos" && parts[1]) return <TodoDetailPage id={parts[1]} />;
  if (parts[0] === "todos") return <TodosPage />;
  if (parts[0] === "replies" && parts[1]) return <ReplyDetailPage id={parts[1]} />;
  if (parts[0] === "replies") return <RepliesPage />;
  if (parts[0] === "runs") return <RunsPage />;
  if (parts[0] === "knowledge") return <KnowledgePage />;
  if (parts[0] === "settings") return <SettingsPage />;
  return <DashboardPage />;
}

export default function App() {
  const [route, setRoute] = useState(currentRoute());
  useEffect(() => { const onHash = () => setRoute(currentRoute()); window.addEventListener("hashchange", onHash); return () => window.removeEventListener("hashchange", onHash); }, []);
  return <Layout>{render(route)}</Layout>;
}
