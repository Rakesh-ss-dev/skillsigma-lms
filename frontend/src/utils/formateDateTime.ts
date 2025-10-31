type FirestoreTimestampLike = {
    seconds: number;
    nanoseconds?: number;
    toDate?: () => Date;
};

type DateInput = string | number | Date | FirestoreTimestampLike;

const formatReadableDateTime = (input: DateInput): string => {
    if (input == null) return "Invalid Date";

    let date: Date;

    try {
        if (input instanceof Date) {
            date = input;
        } else if (typeof input === "number") {
            // handle seconds (10 digits) or ms (13+ digits)
            date = input > 1e12 ? new Date(input) : new Date(input * 1000);
        } else if (typeof input === "object") {
            if (typeof input.toDate === "function") {
                date = input.toDate();
            } else if (typeof input.seconds === "number") {
                const ms =
                    input.seconds * 1000 + Math.floor((input.nanoseconds ?? 0) / 1e6);
                date = new Date(ms);
            } else {
                date = new Date(String(input));
            }
        } else {
            const s = String(input).trim();
            date = new Date(s);

            if (isNaN(date.getTime())) {
                // attempt fix for common formats without "T" or with slashes
                let alt = s.replace(/\//g, "-");
                if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}(:\d{2}(\.\d+)?)?$/.test(alt)) {
                    alt = alt.replace(" ", "T") + "Z";
                }
                date = new Date(alt);
            }
        }
    } catch (err) {
        console.error("formatReadableDate: parse error", err, input);
        return "Invalid Date";
    }

    if (!(date instanceof Date) || isNaN(date.getTime())) {
        console.error("formatReadableDate: invalid input ->", input, typeof input);
        return "Invalid Date";
    }

    const opts: Intl.DateTimeFormatOptions = {
        day: "2-digit",
        month: "2-digit",
        year: "numeric", // 4-digit year
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
        timeZone: "Asia/Kolkata",
    };

    try {
        return date.toLocaleString("en-IN", opts);
    } catch {
        // manual IST fallback
        const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
        const ist = new Date(date.getTime() + IST_OFFSET_MS);

        const dd = String(ist.getUTCDate()).padStart(2, "0");
        const mm = String(ist.getUTCMonth() + 1).padStart(2, "0");
        const yyyy = String(ist.getUTCFullYear());
        const hh = String(ist.getUTCHours()).padStart(2, "0");
        const min = String(ist.getUTCMinutes()).padStart(2, "0");

        return `${dd}/${mm}/${yyyy}, ${hh}:${min}`;
    }
};

export default formatReadableDateTime