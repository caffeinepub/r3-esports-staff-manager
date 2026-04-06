import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, KeyRound, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";
import { useAdminChangePassword } from "../hooks/useQueries";

interface AdminChangePasswordDialogProps {
  targetUserId: bigint;
  targetUsername: string;
  open: boolean;
  onClose: () => void;
}

export function AdminChangePasswordDialog({
  targetUserId,
  targetUsername,
  open,
  onClose,
}: AdminChangePasswordDialogProps) {
  const { userId } = useAuth();
  const adminChangePassword = useAdminChangePassword();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleClose = () => {
    setNewPassword("");
    setConfirmPassword("");
    setShowNew(false);
    setShowConfirm(false);
    onClose();
  };

  const validate = () => {
    if (newPassword.length < 6)
      return "Password must be at least 6 characters.";
    if (newPassword !== confirmPassword) return "Passwords do not match.";
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const error = validate();
    if (error) {
      toast.error(error);
      return;
    }
    if (!userId) {
      toast.error("Not authenticated.");
      return;
    }
    try {
      await adminChangePassword.mutateAsync({
        requesterId: userId,
        targetUserId,
        newPassword,
      });
      toast.success(`Password for ${targetUsername} changed!`);
      handleClose();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to change password.",
      );
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) handleClose();
      }}
    >
      <DialogContent
        className="bg-gaming-card border-gaming-border text-foreground sm:max-w-md"
        data-ocid="admin_change_password.dialog"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-blue-400">
            <KeyRound className="h-4 w-4" />
            Change Password for {targetUsername}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Set a new password for this account. They will need to use it on
            next login.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* New Password */}
          <div className="space-y-1.5">
            <Label htmlFor="admin-new-pw" className="text-sm text-foreground">
              New Password
            </Label>
            <div className="relative">
              <Input
                id="admin-new-pw"
                type={showNew ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Min. 6 characters"
                className="bg-gaming-darker border-gaming-border pr-10 focus:border-blue-400/60"
                autoComplete="new-password"
                data-ocid="admin_change_password.new.input"
              />
              <button
                type="button"
                onClick={() => setShowNew((v) => !v)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                tabIndex={-1}
              >
                {showNew ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div className="space-y-1.5">
            <Label
              htmlFor="admin-confirm-pw"
              className="text-sm text-foreground"
            >
              Confirm New Password
            </Label>
            <div className="relative">
              <Input
                id="admin-confirm-pw"
                type={showConfirm ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat new password"
                className="bg-gaming-darker border-gaming-border pr-10 focus:border-blue-400/60"
                autoComplete="new-password"
                data-ocid="admin_change_password.confirm.input"
              />
              <button
                type="button"
                onClick={() => setShowConfirm((v) => !v)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                tabIndex={-1}
              >
                {showConfirm ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={handleClose}
              className="text-muted-foreground hover:text-foreground"
              data-ocid="admin_change_password.cancel_button"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={adminChangePassword.isPending}
              className="bg-blue-600 hover:bg-blue-500 text-white"
              data-ocid="admin_change_password.submit_button"
            >
              {adminChangePassword.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>Set Password</>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
