import { Users } from "lucide-react";
import { initials } from "@/lib/format";
import { cn } from "@/lib/utils";

const AVATAR_SIZES = {
  xs: "size-6 text-[9px]",
  sm: "size-7 text-[10px]",
  md: "size-8 text-[11px]",
  lg: "size-10 text-[13px]",
  xl: "size-12 text-[15px]",
} as const;

export type AvatarSize = keyof typeof AVATAR_SIZES;

export function Avatar({
  name,
  color,
  size = "md",
  className,
  ring = false,
}: {
  name: string;
  color: string;
  size?: AvatarSize;
  className?: string;
  ring?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-grid shrink-0 place-items-center rounded-full font-semibold tracking-wide text-[#0b0d09]",
        AVATAR_SIZES[size],
        ring && "ring-2 ring-ink",
        className,
      )}
      style={{ backgroundColor: color }}
      title={name}
    >
      {initials(name)}
    </span>
  );
}

export function AvatarStack({
  members,
  size = "md",
  className,
}: {
  members: { id: string; name: string; color: string }[];
  size?: AvatarSize;
  className?: string;
}) {
  return (
    <span className={cn("flex items-center", className)}>
      {members.map((member, index) => (
        <Avatar
          key={member.id}
          name={member.name}
          color={member.color}
          size={size}
          ring
          className={index > 0 ? "-ml-2" : undefined}
        />
      ))}
    </span>
  );
}

export function JointAvatar({ size = "md", className }: { size?: AvatarSize; className?: string }) {
  return (
    <span
      className={cn(
        "inline-grid shrink-0 place-items-center rounded-full text-[#0b0d09]",
        AVATAR_SIZES[size],
        className,
      )}
      style={{
        background:
          "conic-gradient(from 220deg at 50% 50%, #FF8A70 0deg 180deg, #63E6C1 180deg 360deg)",
      }}
      title="Joint account"
    >
      <span className="grid size-[72%] place-items-center rounded-full bg-ink">
        <Users className="size-[45%] text-white" />
      </span>
    </span>
  );
}

export function PayerAvatar({
  paidBy,
  members,
  size = "md",
}: {
  paidBy: string;
  members: { id: string; name: string; color: string }[];
  size?: AvatarSize;
}) {
  if (paidBy === "joint") return <JointAvatar size={size} />;
  const member = members.find((entry) => entry.id === paidBy);
  if (!member) {
    return (
      <span className={cn("inline-grid place-items-center rounded-full bg-white/10 text-muted", AVATAR_SIZES[size])}>
        ?
      </span>
    );
  }
  return <Avatar name={member.name} color={member.color} size={size} />;
}
