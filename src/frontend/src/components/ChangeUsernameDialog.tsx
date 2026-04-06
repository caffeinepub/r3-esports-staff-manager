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
import { Eye, EyeOff, Loader2, UserPen } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";
import { useChangeUsername } from "../hooks/useQueries";

interface ChangeUsernameDialogProps {
  open: boolean;
  onClose: () => void;
}

export function ChangeUsernameDialog({
  open,
  onClose,
}: ChangeUsernameDialogProps) {
  const { userId, username, updateUsername } = useAuth();
  const changeUsername = useChangeUsername();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleClose = () => {
    setCurrentPassword("");
    setNewUsername("");
    setShowPassword(false);
    onClose();
  };

  const validate = () => {
    if (!currentPassword) return "Current password is required.";
    const trimmed = newUsername.trim();
    if (trimmed.length < 3) return "Username must be at least 3 characters.";
    if (trimmed.length > 30) return "Username must be 30 characters or fewer.";
    if (trimmed === username)
      return "New username must differ from your current username.";
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
      await changeUsername.mutateAsync({
        userId,
        currentPassword,
        newUsername: newUsername.trim(),
      });
      updateUsername(newUsername.trim());
      toast.success("Username changed successfully!");
      handleClose();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to change username.",
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
        className="bg-white border-amber-200 text-foreground sm:max-w-md"
        data-ocid="change_username.dialog"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-amber-600">
            <UserPen className="h-4 w-4" />
            Change Username
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Enter your current password to confirm and choose a new username.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="cu-current-pw" className="text-sm text-foreground">
              Current Password
            </Label>
            <div className="relative">
              <Input
                id="cu-current-pw"
                type={showPassword ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Your current password"
                className="bg-amber-50/50 border-amber-200 pr-10 focus:border-amber-400"
                autoComplete="current-password"
                data-ocid="change_username.password.input"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label
              htmlFor="cu-new-username"
              className="text-sm text-foreground"
            >
              New Username
            </Label>
            <Input
              id="cu-new-username"
              type="text"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              placeholder="3–30 characters"
              className="bg-amber-50/50 border-amber-200 focus:border-amber-400"
              autoComplete="off"
              maxLength={30}
              data-ocid="change_username.new.input"
            />
            {newUsername.trim().length > 0 && (
              <p className="text-xs text-muted-foreground">
                {newUsername.trim().length}/30 characters
              </p>
            )}
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={handleClose}
              className="text-muted-foreground hover:text-foreground"
              data-ocid="change_username.cancel_button"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={changeUsername.isPending}
              className="bg-amber-500 hover:bg-amber-600 text-white"
              data-ocid="change_username.submit_button"
            >
              {changeUsername.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>Save Username</>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
