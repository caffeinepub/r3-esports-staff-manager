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
import { Loader2, UserPen } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";
import { useAdminChangeUsername } from "../hooks/useQueries";

interface AdminChangeUsernameDialogProps {
  targetUserId: bigint;
  targetUsername: string;
  open: boolean;
  onClose: () => void;
}

export function AdminChangeUsernameDialog({
  targetUserId,
  targetUsername,
  open,
  onClose,
}: AdminChangeUsernameDialogProps) {
  const { userId } = useAuth();
  const adminChangeUsername = useAdminChangeUsername();
  const [newUsername, setNewUsername] = useState("");

  const handleClose = () => {
    setNewUsername("");
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newUsername.trim();
    if (trimmed.length < 3) {
      toast.error("Username must be at least 3 characters.");
      return;
    }
    if (trimmed.length > 30) {
      toast.error("Username must be 30 characters or fewer.");
      return;
    }
    if (trimmed === targetUsername) {
      toast.error("New username must differ from current username.");
      return;
    }
    if (!userId) {
      toast.error("Not authenticated.");
      return;
    }
    try {
      await adminChangeUsername.mutateAsync({
        requesterId: userId,
        targetUserId,
        newUsername: trimmed,
      });
      toast.success(`Username changed to "${trimmed}"!`);
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
        data-ocid="admin_change_username.dialog"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-amber-600">
            <UserPen className="h-4 w-4" />
            Change Username
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Changing username for{" "}
            <span className="font-semibold text-foreground">
              {targetUsername}
            </span>
            .
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label
              htmlFor="acu-new-username"
              className="text-sm text-foreground"
            >
              New Username
            </Label>
            <Input
              id="acu-new-username"
              type="text"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              placeholder="3–30 characters"
              className="bg-amber-50/50 border-amber-200 focus:border-amber-400"
              autoComplete="off"
              maxLength={30}
              autoFocus
              data-ocid="admin_change_username.new.input"
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
              data-ocid="admin_change_username.cancel_button"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={adminChangeUsername.isPending}
              className="bg-amber-500 hover:bg-amber-600 text-white"
              data-ocid="admin_change_username.submit_button"
            >
              {adminChangeUsername.isPending ? (
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
