import { useEffect } from "react";

export interface ToastMessage {
    id: number;
    message: string;
    type: "success" | "error" | "info";
}

interface ToastContainerProps {
    toasts: ToastMessage[];
    removeToast: (id: number) => void;
}

const Toast = ({ id, message, type, removeToast }: ToastMessage & { removeToast: (id: number) => void }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            removeToast(id);
        }, 4000); // Auto remove after 4 seconds

        return () => clearTimeout(timer);
    }, [id, removeToast]);

    return (
        <div className={`toast toast-${type}`} onClick={() => removeToast(id)}>
            {type === "success" && "✅ "}
            {type === "error" && "❌ "}
            {type === "info" && "ℹ️ "}
            {message}
        </div>
    );
};

export const ToastContainer = ({ toasts, removeToast }: ToastContainerProps) => {
    return (
        <div className="toast-container">
            {toasts.map((toast) => (
                <Toast key={toast.id} {...toast} removeToast={removeToast} />
            ))}
        </div>
    );
};
