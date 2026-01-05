import {
  Form,
  Link,
  NavLink,
  Outlet,
  useNavigation,
  useSubmit,
  useNavigate,
  useLocation,
} from "react-router";
import { getContacts } from "../data";
import type { Route } from "./+types/sidebar";
import { useEffect, useState, useRef } from "react";

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const q = url.searchParams.get("q");
  const contacts = await getContacts(q);
  return { contacts, q };
}

export default function SidebarLayout({ loaderData }: Route.ComponentProps) {
  const { contacts, q } = loaderData;
  const navigation = useNavigation();
  // the query now needs to be kept in state
  const [query, setQuery] = useState(q || "");
  const submit = useSubmit();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searching =
    navigation.location &&
    new URLSearchParams(navigation.location.search).has("q");

  const navigate = useNavigate();
  const location = useLocation();
  // 1. Справжній пошук — це коли ми змінюємо параметри URL, але залишаємось на тому ж шляху
  const isSearching =
    navigation.location &&
    new URLSearchParams(navigation.location.search).has("q") &&
    navigation.location.pathname === location.pathname;

  // 2. Справжня навігація — це коли змінюється шлях до контакту
  const isNavigatingToContact =
    navigation.state === "loading" &&
    navigation.location?.pathname !== location.pathname;

  // we still have a `useEffect` to synchronize the query
  // to the component state on back/forward button clicks
  useEffect(() => {
    setQuery(q || "");
    // Якщо q став порожнім (наприклад, після натискання кнопки очищення)
    // ми повертаємо фокус в інпут
    if (q === null || q === "") {
      searchInputRef.current?.focus();
    }
  }, [q]);

  return (
    <>
      <div id="sidebar">
        <h1>
          <Link to="about">React Router Contacts</Link>
        </h1>
        <div>
          <Form
            id="search-form"
            onChange={(event) => {
              const isFirstSearch = q === null;
              submit(event.currentTarget, {
                replace: !isFirstSearch,
              });
            }}
            role="search"
          >
            <input
              ref={searchInputRef}
              aria-label="Search contacts"
              className={isSearching ? "loading" : ""}
              id="q"
              name="q"
              // synchronize user's input to component state
              onChange={(event) => setQuery(event.currentTarget.value)}
              placeholder="Search"
              type="search"
              // switched to `value` from `defaultValue`
              value={query}
            />
            {/* Кнопка очищення (показуємо лише якщо в інпуті є текст) */}
            {query && (
              <button
                type="button"
                id="search-clear"
                onClick={() => {
                  setQuery(""); // Очищаємо локальний стан
                  // Програмно відправляємо порожню форму, щоб скинути URL та список
                  // submit({ q: "" }); // Очищаємо URL (це змінить q і запустить useEffect)
                  navigate(location.pathname, { replace: true });
                }}
              >
                ✕
              </button>
            )}

            <div aria-hidden hidden={!isSearching} id="search-spinner" />
          </Form>
          <Form method="post">
            <button type="submit">New</button>
          </Form>
        </div>
        <nav>
          {contacts.length ? (
            <ul>
              {contacts.map((contact) => (
                <li key={contact.id}>
                  <NavLink
                    className={({ isActive, isPending }) =>
                      isActive ? "active" : isPending ? "pending" : ""
                    }
                    to={{
                      pathname: `contacts/${contact.id}`,
                      search: q ? `?q=${q}` : "",
                    }}
                  >
                    {contact.first || contact.last ? (
                      <>
                        {contact.first} {contact.last}
                      </>
                    ) : (
                      <i>No Name</i>
                    )}
                    {contact.favorite ? <span>★</span> : null}
                  </NavLink>
                </li>
              ))}
            </ul>
          ) : (
            <p>
              <i>No contacts</i>
            </p>
          )}
        </nav>
      </div>
      <div
        className={
          // Ефект "блідості" (opacity) додаємо ТІЛЬКИ при переході між контактами
          isNavigatingToContact ? "loading" : ""
        }
        id="detail"
      >
        <Outlet />
      </div>
    </>
  );
}
