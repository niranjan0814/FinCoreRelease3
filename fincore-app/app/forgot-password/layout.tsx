import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Forgot Password - FinCore LMS",
    description: "Reset your password for FinCore LMS",
};

export default function ForgotPasswordLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
