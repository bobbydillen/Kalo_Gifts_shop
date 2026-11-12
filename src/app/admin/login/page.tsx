import { LoginForm } from "./LoginForm";

export const metadata = { title: "Sign in" };

export default function AdminLoginPage() {
  return (
    <div className="grid flex-1 place-items-center px-4 py-16">
      <div className="w-full max-w-md">
        <p className="kicker">KALO Gifts</p>
        <h1 className="mt-4 text-5xl">
          Admin <em>sign in</em>
        </h1>
        <LoginForm />
      </div>
    </div>
  );
}
