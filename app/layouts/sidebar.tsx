import {
  Form,
  Link,
  NavLink,
  Outlet,
  useNavigation,
  useSubmit,
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

  // we still have a `useEffect` to synchronize the query
  // to the component state on back/forward button clicks
  useEffect(() => {
    setQuery(q || "");
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
              className={searching ? "loading" : ""}
              //defaultValue={q || ""}
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
                  submit({ q: "" });
                  setTimeout(() => {
                    searchInputRef.current?.focus();
                  }, 0);
                }}
              >
                ✕
              </button>
            )}

            <div aria-hidden hidden={true} id="search-spinner" />
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
          navigation.state === "loading" && !searching ? "loading" : ""
        }
        id="detail"
      >
        <Outlet />
      </div>
    </>
  );
}
