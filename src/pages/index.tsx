/* eslint-disable @next/next/no-img-element */
import { type NextPage } from "next";
import { signIn, signOut, useSession } from "next-auth/react";
import Head from "next/head";
import { useState } from "react";
import { api } from "~/utils/api";
import type { RouterOutputs } from "~/utils/api";
import CodeMirror from "@uiw/react-codemirror";
import { languages } from "@codemirror/language-data";
import { markdown, markdownLanguage } from "@codemirror/lang-markdown";
import ReactMarkdown from "react-markdown";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import SaveAltIcon from "@mui/icons-material/SaveAlt";
import LoginIcon from "@mui/icons-material/Login";
import GitHubIcon from "@mui/icons-material/GitHub";
import LaunchIcon from "@mui/icons-material/Launch";

type Topic = RouterOutputs["topic"]["getAll"][0];
type Snippet = RouterOutputs["snippet"]["getAll"][0];

const Home: NextPage = () => {
  const { data: sessionData } = useSession();
  return (
    <>
      <Head>
        <title>Code Snippets</title>
        <meta name="description" content="All in one markdown notes app." />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      {/* User Logged In */}
      {sessionData !== null && <MainContent />}
      {/* User Not Logged In */}
      {sessionData === null && <Login />}
    </>
  );
};

export default Home;

const Login = () => {
  return (
    <>
      <LoginHeader />
      <main className="grid min-h-screen w-screen place-items-center bg-gradient-to-bl from-base-100 to-secondary">
        <div className="flex max-w-3xl flex-col gap-12 p-4 md:flex-row md:gap-20">
          <div className="grid place-items-center">
            <h1 className="text-center text-3xl md:text-4xl">
              Save your code. Simple, Fast.
            </h1>
          </div>
          {/* Login Card */}
          <div className="card h-64 w-full max-w-sm bg-base-100 bg-opacity-20 backdrop-blur-3xl">
            <div className="card-body items-center gap-8">
              <h2 className="text-2xl font-bold sm:text-3xl md:text-4xl">
                Login with GitHub
              </h2>
              <h3 className="text-3xl text-secondary">
                <GitHubIcon />
              </h3>
              <button
                className="btn-outline btn max-w-md"
                onClick={() => void signIn()}
              >
                Login <LoginIcon />
              </button>
            </div>
          </div>
          {/* Login Card */}
        </div>
      </main>
    </>
  );
};

const MainContent = () => {
  const { data: sessionData } = useSession();
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const { data: topics, refetch: refetchTopics } = api.topic.getAll.useQuery(
    undefined, // no input
    {
      enabled: sessionData?.user !== undefined,
      onSuccess: (data) => {
        setSelectedTopic(selectedTopic ?? data[0] ?? null);
      },
    }
  );

  const createTopic = api.topic.create.useMutation({
    onSuccess: () => {
      void refetchTopics(); // void tells TS to calm down for now
    },
  });

  const { data: snippets, refetch: refetchSnippets } =
    api.snippet.getAll.useQuery(
      {
        topicId: selectedTopic?.id ?? "",
      },
      {
        enabled: sessionData?.user !== undefined && selectedTopic !== null,
      }
    );

  const createSnippet = api.snippet.create.useMutation({
    onSuccess: () => {
      void refetchSnippets(); // void tells TS to calm down for now
    },
  });

  const deleteSnippet = api.snippet.delete.useMutation({
    onSuccess: () => {
      void refetchSnippets(); // void tells TS to calm down for now
    },
  });

  return (
    <>
      <MainHeader />
      <main className="mx-6 grid min-h-screen grid-cols-6 gap-2 pt-16">
        {/* Sidebar */}
        <div className="p-2">
          <div className="divider"></div>
          <input
            type="text"
            name="topics"
            id="topics"
            placeholder="New Topic"
            className="input-bordered input input-sm w-full"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                createTopic.mutate({
                  title: e.currentTarget.value,
                });
                e.currentTarget.value = "";
              }
            }}
          />
          <div className="divider"></div>
          <ul className="menu rounded-box w-full bg-base-100 p-2">
            {topics?.map((topic) => (
              <li className="w-full" key={topic.id}>
                <a
                  className="w-full"
                  onClick={(e) => {
                    e.preventDefault();
                    setSelectedTopic(topic);
                  }}
                >
                  {topic.title}
                </a>
              </li>
            ))}
          </ul>
        </div>
        {/* Sidebar */}
        {/* Snippets */}
        <div className="col-span-5 bg-base-100">
          <Editor
            onSave={({ title, content }) => {
              void createSnippet.mutate({
                title,
                content,
                topicId: selectedTopic?.id ?? "",
              });
            }}
          />
          <div className="divider px-8"></div>
          <div className="flex flex-col gap-4 p-8">
            {snippets?.map((snippet) => (
              <div key={snippet.id}>
                <SnippetView
                  snippet={snippet}
                  onDelete={() => void deleteSnippet.mutate({ id: snippet.id })}
                />
              </div>
            ))}
          </div>
        </div>
        {/* Snippets */}
      </main>
    </>
  );
};

const MainHeader = () => {
  const { data: sessionData } = useSession();

  return (
    <header className="navbar fixed z-50 bg-base-100 p-4">
      <div className="flex-1">
        <a className="btn-ghost btn text-xl normal-case">
          {sessionData?.user?.name ? `${sessionData.user.name}'s Snippets` : ""}
        </a>
      </div>
      <div className="flex-none gap-2">
        <div className="dropdown-end dropdown">
          <label tabIndex={0} className="btn-ghost btn-circle avatar btn">
            <div className="w-16 rounded-full">
              <img
                src={
                  sessionData?.user?.image ? `${sessionData.user.image}` : ""
                }
                alt="Profile Picture"
              />
            </div>
          </label>
          <ul
            tabIndex={0}
            className="dropdown-content menu rounded-box menu-sm mt-3 w-52 bg-base-100 p-2 shadow"
          >
            <li>
              <a className="justify-between">
                Profile
                <span className="badge">New</span>
              </a>
            </li>
            <li>
              <a>Settings</a>
            </li>
            <li>
              <a onClick={() => void signOut()}>Logout</a>
            </li>
          </ul>
        </div>
      </div>
    </header>
  );
};

const LoginHeader = () => {
  return (
    <header className="navbar fixed z-50 bg-base-100 bg-opacity-20 p-4 backdrop-blur-3xl">
      <div className="flex-1">
        <a className="btn-ghost btn text-xl normal-case">Code Snippets</a>
      </div>
      <div className="flex-end">
        <a className="btn-ghost btn text-xl normal-case">
          Docs <LaunchIcon />
        </a>
      </div>
    </header>
  );
};

const Editor = ({
  onSave,
}: {
  onSave: (snippet: { title: string; content: string }) => void;
}) => {
  const [code, setCode] = useState("");
  const [title, setTitle] = useState("");

  return (
    <div className="card">
      <div className="card-body pb-0">
        <h2 className="card-title">
          <input
            type="text"
            placeholder="New Snippet"
            className="input-bordered input input-lg w-full font-bold"
            value={title}
            onChange={(e) => setTitle(e.currentTarget.value)}
          />
        </h2>
        <CodeMirror
          placeholder={"Type some markdown..."}
          value={code}
          minHeight="30vh"
          extensions={[
            markdown({ base: markdownLanguage, codeLanguages: languages }),
          ]}
          onChange={(value) => setCode(value)}
          className="w-full"
          theme={"light"}
        />
        <div className="card-actions justify-end p-2">
          <button
            onClick={() => {
              onSave({
                title,
                content: code,
              });
              setCode("");
              setTitle("");
            }}
            disabled={title.trim().length === 0 || code.trim().length === 0}
            className={`${
              title.trim().length === 0 || code.trim().length === 0
                ? "cursor-not-allowed text-neutral"
                : "text-success"
            }`}
          >
            <SaveAltIcon />
          </button>
        </div>
      </div>
    </div>
  );
};

const SnippetView = ({
  snippet,
  onDelete,
}: {
  snippet: Snippet;
  onDelete: () => void;
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="card border-2 border-neutral p-2 shadow-2xl">
      <div className="card-body p-0">
        <div
          className={`collapse-arrow ${isOpen ? "collapse-open" : ""} collapse`}
        >
          <h2
            className="collapse-title cursor-pointer text-xl font-bold"
            onClick={() => setIsOpen(!isOpen)}
          >
            {snippet.title}
          </h2>
          <div className="collapse-content">
            <div className="divider" />
            <article className="prose-stone prose p-2">
              <ReactMarkdown>{snippet.content}</ReactMarkdown>
            </article>
            <div className="card-actions flex w-full justify-end">
              <button className="text-error" onClick={onDelete}>
                <DeleteForeverIcon />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
