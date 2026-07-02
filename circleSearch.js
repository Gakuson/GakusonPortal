const $ = (e) => document.querySelector(e);
const $$ = (e) => document.querySelectorAll(e);

const tagsList = {
    cultural: ["文化系", "#ff9999"],
    sports: ["運動系", "#99ff99"],
    other: ["その他", "#cccccc"],
    official: ["公認", "#ffcc99"],
    semiOfficial: ["準公認", "#ccccff"],
    coreGroup: ["コアG", "#ff99cc"],
    unofficial: ["有志", "#99ccff"],
    noHolidayActivity: ["平日のみ", "#ffff99"],
    onlyHolidayActivity: ["休日のみ", "#99ffff"],
    noClubFee: ["部費なし", "#ffccff"],
    onCampusActivity: ["学内活動", "#99ff99"],
    offCampusActivity: ["学外活動", "#99ccff"],
};

const periodList = {
    mon: "月",
    tue: "火",
    wed: "水",
    thu: "木",
    fri: "金",
    sat: "土",
    sun: "日",
    4: "4限",
    5: "5限",
    n: "昼",
    a: "AM",
    p: "PM",
};

const dayColor = { weekdays: "#ffffff", sat: "#bbeeff", sun: "#ffbbbb" };

const genderBarColor = { m: "#99ccff", f: "#ff99cc" };

(async () => {
    const circleListRaw = await fetch("circleList.json");
    const circleList = await circleListRaw.json();

    const clubTypeSelect = $("#clubType");
    const clubSizeSelect = $("#clubSize");
    const sortOrderSelect = $("#sortOrder");
    const activityTimeContainer = $("#activityTime");
    const circleListContainer = $(".clubSearchResults");

    const compareNameKanaAsc = (a, b) => {
        const aKey = String(a?.nameKana ?? a?.name ?? "");
        const bKey = String(b?.nameKana ?? b?.name ?? "");
        return aKey.localeCompare(bKey, "ja");
    };

    const compareNameKanaDesc = (a, b) => {
        return -compareNameKanaAsc(a, b);
    };

    const getTotalMembers = (club) => {
        const m = Number(club?.members?.m ?? 0);
        const f = Number(club?.members?.f ?? 0);
        const n = Number(club?.members?.n ?? 0);
        return m + f + n;
    };

    const getSizeKey = (club) => {
        const total = getTotalMembers(club);
        if (total <= 10) return "small";
        if (total <= 30) return "medium";
        return "large";
    };

    const getSelectedActivityTimes = () => {
        const checked = activityTimeContainer.querySelectorAll('input[type="checkbox"]:checked');
        return Array.from(checked).map((el) => el.value);
    };

    const createTag = (text, bgColor) => {
        const tag = document.createElement("span");
        tag.classList.add("tag");
        tag.textContent = text;
        if (bgColor) {
            tag.style.backgroundColor = bgColor;
        }
        return tag;
    };

    const getActivityTagColor = (dayKey) => {
        if (dayKey === "sat") return dayColor.sat;
        if (dayKey === "sun") return dayColor.sun;
        return dayColor.weekdays;
    };

    const getDerivedTagKeysFromActivityTime = (club) => {
        const clubTimes = Array.isArray(club.activityTime) ? club.activityTime : [];
        if (clubTimes.length === 0) return [];

        const days = new Set(clubTimes.map((code) => String(code).split("-")[0]).filter((d) => d));

        const hasWeekday = ["mon", "tue", "wed", "thu", "fri"].some((d) => days.has(d));
        const hasWeekend = ["sat", "sun"].some((d) => days.has(d));

        if (hasWeekday && !hasWeekend) return ["noHolidayActivity"];
        if (hasWeekend && !hasWeekday) return ["onlyHolidayActivity"];
        return [];
    };

    const getDerivedTagKeysFromFee = (club) => {
        const fee = club?.fee;
        if (typeof fee !== "string") return [];

        const normalized = fee.replaceAll(",", "").trim();
        if (normalized === "") return [];
        if (normalized.includes("無料")) return ["noClubFee"];

        const m = normalized.match(/(\d+)\s*円/);
        if (!m) return [];
        const amount = Number(m[1]);
        if (!Number.isFinite(amount)) return [];
        return amount === 0 ? ["noClubFee"] : [];
    };

    const getDerivedTagKeysFromActivityPlace = (club) => {
        const ap = club?.activityPlace;
        if (!ap || typeof ap !== "object") return [];

        const keys = [];
        if (ap.onCampus) keys.push("onCampusActivity");
        if (ap.offCampus) keys.push("offCampusActivity");
        return keys;
    };

    const getActivityFrequencyScore = (club) => {
        const clubTimes = Array.isArray(club.activityTime) ? club.activityTime : [];
        const daySet = new Set(clubTimes.map((code) => String(code).split("-")[0]).filter((d) => d));
        const dayCount = daySet.size;
        const timesCount = clubTimes.length;
        return { dayCount, timesCount };
    };

    const getFeeComparableValue = (club) => {
        const feeText = club?.fee;
        if (typeof feeText !== "string") return NaN;
        const normalized = feeText.replaceAll(",", "").trim();
        if (normalized === "") return NaN;
        if (normalized === "0円") return 0;
        if (normalized.includes("無料")) return 0;

        const m = normalized.match(/(\d+)\s*円(?:\s*\/\s*(回|週|月|クオーター|半年|年))?/);
        if (!m) return NaN;
        const amount = Number(m[1]);
        if (!Number.isFinite(amount)) return NaN;
        const unit = m[2];

        // 回ごとの場合、週何日活動するかを取得して換算
        if (!unit || unit === "回") {
            const freq = getActivityFrequencyScore(club);
            const estimatedDaysPerWeek = freq.dayCount > 0 ? freq.dayCount : 1;
            return (amount * estimatedDaysPerWeek) / 7;
        }

        // 単位を考慮して日額換算
        if (unit === "週") return amount / 7;
        if (unit === "月") return amount / 30.3;
        if (unit === "クオーター") return amount / 91;
        if (unit === "半年") return amount / 182;
        if (unit === "年") return amount / 365;

        return amount;
    };

    const compareActivityFrequencyHigh = (a, b) => {
        const aScore = getActivityFrequencyScore(a);
        const bScore = getActivityFrequencyScore(b);

        if (aScore.dayCount !== bScore.dayCount) return bScore.dayCount - aScore.dayCount;
        if (aScore.timesCount !== bScore.timesCount) return bScore.timesCount - aScore.timesCount;
        return compareNameKanaAsc(a, b);
    };

    const compareActivityFrequencyLow = (a, b) => {
        const aScore = getActivityFrequencyScore(a);
        const bScore = getActivityFrequencyScore(b);

        if (aScore.dayCount !== bScore.dayCount) return aScore.dayCount - bScore.dayCount;
        if (aScore.timesCount !== bScore.timesCount) return aScore.timesCount - bScore.timesCount;
        return compareNameKanaAsc(a, b);
    };

    const compareMembersHigh = (a, b) => {
        const diff = getTotalMembers(b) - getTotalMembers(a);
        if (diff !== 0) return diff;
        return compareNameKanaAsc(a, b);
    };

    const compareMembersLow = (a, b) => {
        const diff = getTotalMembers(a) - getTotalMembers(b);
        if (diff !== 0) return diff;
        return compareNameKanaAsc(a, b);
    };

    const compareFeeHigh = (a, b) => {
        const aVal = getFeeComparableValue(a);
        const bVal = getFeeComparableValue(b);
        if (Number.isNaN(aVal) && Number.isNaN(bVal)) return compareNameKanaAsc(a, b);
        if (Number.isNaN(aVal)) return 1;
        if (Number.isNaN(bVal)) return -1;

        const diff = bVal - aVal;
        return diff || compareNameKanaAsc(a, b);
    };

    const compareFeeLow = (a, b) => {
        const aVal = getFeeComparableValue(a);
        const bVal = getFeeComparableValue(b);
        if (Number.isNaN(aVal) && Number.isNaN(bVal)) return compareNameKanaAsc(a, b);
        if (Number.isNaN(aVal)) return 1;
        if (Number.isNaN(bVal)) return -1;

        const diff = aVal - bVal;
        return diff || compareNameKanaAsc(a, b);
    };

    const formatActivityTime = (code) => {
        const [dayKey, slotKey] = String(code).split("-");
        const dayLabel = periodList[dayKey] ?? dayKey;
        const slotLabel = periodList[slotKey] ?? slotKey;
        return `${dayLabel} ${slotLabel}`;
    };

    const createActivityTags = (club) => {
        const activityTags = document.createElement("div");
        activityTags.classList.add("tags", "activityTags");

        const clubTimes = Array.isArray(club.activityTime) ? club.activityTime : [];
        clubTimes.forEach((code) => {
            const [dayKey] = String(code).split("-");
            const tag = createTag(formatActivityTime(code), getActivityTagColor(dayKey));
            tag.classList.add("activityTag");
            activityTags.appendChild(tag);
        });

        return activityTags;
    };

    const createGenderRatioBar = (club) => {
        const wrapper = document.createElement("div");
        wrapper.classList.add("genderRatioBar");

        const male = document.createElement("div");
        male.classList.add("male");
        male.style.backgroundColor = genderBarColor.m;
        const female = document.createElement("div");
        female.classList.add("female");
        female.style.backgroundColor = genderBarColor.f;

        const m = Number(club?.members?.m ?? 0);
        const f = Number(club?.members?.f ?? 0);
        const known = m + f;

        if (known <= 0) {
            male.style.width = "0%";
            female.style.width = "0%";
            wrapper.title = "男女比非公開";
        } else {
            male.style.width = `${Math.ceil((m / known) * 100)}%`;
            female.style.width = `${Math.ceil((f / known) * 100)}%`;
        }

        wrapper.appendChild(male);
        wrapper.appendChild(female);
        return wrapper;
    };

    // --- modal ---
    const modalOverlay = document.createElement("div");
    modalOverlay.className = "modalOverlay";
    modalOverlay.hidden = true;

    const MODAL_OPEN_CLASS = "isOpen";
    let modalCloseTimerId = null;

    const modalContent = document.createElement("div");
    modalContent.className = "modalContent";

    const modalClose = document.createElement("button");
    modalClose.className = "modalClose";
    modalClose.type = "button";
    modalClose.textContent = "×";

    const modalTitle = document.createElement("div");
    modalTitle.className = "modalTitle";

    const modalBody = document.createElement("div");
    modalBody.className = "modalBody";

    modalContent.append(modalClose, modalTitle, modalBody);
    modalOverlay.appendChild(modalContent);
    document.body.appendChild(modalOverlay);

    const closeModal = () => {
        if (modalOverlay.hidden) return;
        modalOverlay.classList.remove(MODAL_OPEN_CLASS);
        if (modalCloseTimerId !== null) {
            window.clearTimeout(modalCloseTimerId);
            modalCloseTimerId = null;
        }
        modalCloseTimerId = window.setTimeout(() => {
            modalOverlay.hidden = true;
            modalTitle.textContent = "";
            modalBody.innerHTML = "";
            modalCloseTimerId = null;
        }, 300);
    };

    const getActivityTimeList = (club) => {
        const clubTimes = Array.isArray(club.activityTime) ? club.activityTime : [];
        const seen = new Set();
        const list = [];
        clubTimes.forEach((code) => {
            const text = formatActivityTime(code);
            if (!seen.has(text)) {
                seen.add(text);
                list.push(text);
            }
        });
        return list;
    };

    const getFeeText = (club) => {
        const fee = club?.fee;
        if (typeof fee === "string" && fee.trim() !== "") {
            return fee;
        }
        return "未設定";
    };

    const createModalTable = (club) => {
        const table = document.createElement("table");
        table.className = "modalTable";

        const tbody = document.createElement("tbody");

        const addRow = (label, html) => {
            const tr = document.createElement("tr");
            const th = document.createElement("th");
            th.scope = "row";
            th.textContent = label;

            const td = document.createElement("td");
            if (html) td.innerHTML = html;

            tr.append(th, td);
            tbody.appendChild(tr);
        };

        addRow("メンバー数", `${getTotalMembers(club)}人`);

        const activityList = getActivityTimeList(club);
        if (activityList.length === 0) {
            addRow("活動日", "未設定");
        } else {
            addRow("活動日", activityList.join("\n"));
        }

        const placeList = Array.isArray(club?.activityPlace?.placeList) ? club.activityPlace.placeList : [];
        if (placeList.length === 0) {
            addRow("活動場所", "未設定");
        } else {
            addRow("活動場所", placeList.join("\n"));
        }

        addRow("部費", getFeeText(club));

        const desc = club.description.trim() ? club.description : "このサークルには説明がありません。";
        addRow("概要", desc);

        table.appendChild(tbody);
        return table;
    };

    const openModal = (club) => {
        modalTitle.textContent = club?.name ?? "詳細";
        modalBody.innerHTML = "";
        modalBody.appendChild(createModalTable(club));
        if (modalCloseTimerId !== null) {
            window.clearTimeout(modalCloseTimerId);
            modalCloseTimerId = null;
        }
        modalOverlay.hidden = false;
        window.requestAnimationFrame(() => modalOverlay.classList.add(MODAL_OPEN_CLASS));
    };

    modalClose.addEventListener("click", closeModal);
    modalOverlay.addEventListener("click", (e) => {
        if (e.target === modalOverlay) {
            closeModal();
        }
    });
    document.addEventListener("keydown", (e) => {
        if (!modalOverlay.hidden && e.key === "Escape") {
            closeModal();
        }
    });

    // --- image ---
    const createNoImageElement = () => {
        const noImage = document.createElement("div");
        noImage.className = "noImage";
        noImage.textContent = "NO IMAGE";
        return noImage;
    };

    const createClubCard = (club) => {
        const clubCard = document.createElement("div");
        clubCard.classList.add("clubCard");

        const imageWrap = document.createElement("div");
        imageWrap.classList.add("image");
        if (club.image) {
            const img = document.createElement("img");
            img.src = club.image;
            img.alt = `${club.name}の画像`;
            img.addEventListener("error", () => {
                imageWrap.innerHTML = "";
                imageWrap.appendChild(createNoImageElement());
            });
            imageWrap.appendChild(img);
        } else {
            imageWrap.appendChild(createNoImageElement());
        }
        clubCard.appendChild(imageWrap);

        const name = document.createElement("div");
        name.classList.add("name");
        name.textContent = club.name;
        clubCard.appendChild(name);

        const tags = document.createElement("div");
        tags.classList.add("tags");

        // 種別タグ
        const typeKey = club.type in tagsList ? club.type : "other";
        const [typeLabel, typeColor] = tagsList[typeKey];
        tags.appendChild(createTag(typeLabel, typeColor));

        // 公認区分タグ
        const authKey = club.authorizationType in tagsList ? club.authorizationType : null;
        if (authKey) {
            const [authLabel, authColor] = tagsList[authKey];
            tags.appendChild(createTag(authLabel, authColor));
        }

        // 派生タグ（JSONに書かなくてOK）
        const derivedKeys = [...getDerivedTagKeysFromActivityTime(club), ...getDerivedTagKeysFromFee(club), ...getDerivedTagKeysFromActivityPlace(club)];
        Array.from(new Set(derivedKeys)).forEach((key) => {
            if (key in tagsList) {
                const [label, color] = tagsList[key];
                tags.appendChild(createTag(label, color));
            }
        });

        clubCard.appendChild(tags);

        // 活動日時タグ（tagsの下）
        clubCard.appendChild(createActivityTags(club));

        const memberInfo = document.createElement("div");
        memberInfo.classList.add("memberInfo");

        const memberCount = document.createElement("span");
        memberCount.classList.add("memberCount");
        memberCount.textContent = `メンバー数: ${getTotalMembers(club)}人`;
        memberInfo.appendChild(memberCount);
        memberInfo.appendChild(createGenderRatioBar(club));

        clubCard.appendChild(memberInfo);

        const detailsButton = document.createElement("button");
        detailsButton.classList.add("detailsButton");
        detailsButton.type = "button";
        detailsButton.textContent = "詳細を見る";
        detailsButton.addEventListener("click", () => openModal(club));
        clubCard.appendChild(detailsButton);

        return clubCard;
    };

    const passesFilters = (club) => {
        // サークル種別（択一）
        const clubType = clubTypeSelect.value;
        if (clubType !== "all" && club.type !== clubType) {
            return false;
        }

        // サークル規模（択一）
        const size = clubSizeSelect.value;
        if (size !== "all" && getSizeKey(club) !== size) {
            return false;
        }

        /* // 活動時間（複数選択）: どれか1つでも一致したらOK
        const selectedTimes = getSelectedActivityTimes();
        if (selectedTimes.length === 0) {
            return false;
        }
        const clubTimes = Array.isArray(club.activityTime) ? club.activityTime : [];
        const matches = clubTimes.some((t) => selectedTimes.includes(t));
        if (!matches) {
            return false;
        } */

        return true;
    };

    const render = () => {
        circleListContainer.innerHTML = "";
        const filtered = circleList.filter(passesFilters);

        const sortOrder = sortOrderSelect?.value ?? "nameAsc";
        const sorted = filtered.slice();
        if (sortOrder === "nameAsc") sorted.sort(compareNameKanaAsc);
        else if (sortOrder === "nameDesc") sorted.sort(compareNameKanaDesc);
        else if (sortOrder === "activityHigh") sorted.sort(compareActivityFrequencyHigh);
        else if (sortOrder === "activityLow") sorted.sort(compareActivityFrequencyLow);
        else if (sortOrder === "membersHigh") sorted.sort(compareMembersHigh);
        else if (sortOrder === "membersLow") sorted.sort(compareMembersLow);
        else if (sortOrder === "feeHigh") sorted.sort(compareFeeHigh);
        else if (sortOrder === "feeLow") sorted.sort(compareFeeLow);
        else sorted.sort(compareNameKanaAsc);

        sorted.forEach((club) => {
            circleListContainer.appendChild(createClubCard(club));
        });

        if (sorted.length === 0) {
            const noResults = document.createElement("h2");
            noResults.textContent = "条件に一致するサークルは見つかりませんでした。";
            circleListContainer.appendChild(noResults);
        }
    };

    // 変更したら即時反映（検索ボタン無し）
    clubTypeSelect.addEventListener("change", render);
    clubSizeSelect.addEventListener("change", render);
    sortOrderSelect?.addEventListener("change", render);
    render();
})();
