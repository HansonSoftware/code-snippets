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

      <Header />

      {sessionData !== null && (
        <main className="mx-6 grid min-h-screen grid-cols-6 gap-2 pt-16">
          <MainContent />
        </main>
      )}

      {sessionData === null && (
        <main className="mx-6 grid min-h-screen grid-cols-6 gap-2 pt-16">
          <button className="btn-primary btn" onClick={() => void signIn()}>
            Sign in
          </button>
        </main>
      )}
    </>
  );
};

export default Home;

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
    </>
  );
};

const Header = () => {
  const { data: sessionData } = useSession();

  return (
    <nav className="navbar fixed z-50 bg-base-100 p-4">
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
    </nav>
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
          theme={"dark"}
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
