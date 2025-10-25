import React from "react";

type Props = {
	label?: string;
	newTab?: boolean;
	url?: string;
	className?: string;
};

export default function LeaderboardRedirect({ label = "Open Leaderboard", newTab = true, url, className }: Props) {
	const target = url ?? "/leaderboard-ui";
	function onClick() {
		if (newTab) window.open(target, "_blank", "noopener,noreferrer");
		else window.location.href = target;
	}
	return (
		<button type="button" className={className} onClick={onClick}>
			{label}
		</button>
	);
}
