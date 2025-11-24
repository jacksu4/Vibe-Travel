export type Language = 'en' | 'zh';

export const translations = {
    en: {
        // Homepage Hero
        hero: {
            title: 'Serendipity',
            subtitle: 'The Global Detour Engine',
            tagline: 'Discover the unexpected. Plan the unforgettable.',
        },
        // FloatingIsland
        island: {
            startPlaceholder: 'Where are you?',
            endPlaceholder: 'Where to?',
            duration: 'Duration',
            days: 'Days',
            efficiency: 'Efficiency',
            serendipity: 'Serendipity',
            launch: 'Launch',
            calculating: 'Calculating Route...',
            expandPlanner: 'Plan New Trip',
            collapse: 'Minimize',
            expand: 'Plan Trip',
            vibeHints: {
                efficient: 'Direct route. Minimal stops.',
                balanced: 'Balanced mix of speed and sights.',
                serendipity: 'Taking the scenic route. +2h travel time.',
            },
        },
        // WaypointPopup
        popup: {
            vibeCheck: 'Vibe Check',
            prevStop: 'Prev Stop',
            nextStop: 'Next Stop',
            nearbyPlaces: 'Nearby Places',
            loadingNearby: 'Finding nearby places...',
            within3km: 'within 3km',
            noNearbyPlaces: 'No nearby places found within 3km',
            tryDifferentLocation: 'Try selecting a different waypoint',
            types: {
                food: 'Food',
                sight: 'Sight',
                shop: 'Shop',
                activity: 'Activity',
                other: 'Other',
            },
        },
        // Map Controls
        map: {
            voidMode: 'Void Mode',
            lightMode: 'Light Mode',
            satelliteMode: 'Satellite Mode',
            resetView: 'Reset View',
        },
        // Error Messages
        errors: {
            planningFailed: 'Failed to plan trip. Please check your API keys and try again.',
            nearbyFailed: 'Failed to load nearby places. Please try again.',
        },
    },
    zh: {
        // Homepage Hero
        hero: {
            title: '缘分之旅',
            subtitle: '全球绕行引擎',
            tagline: '发现意外惊喜，规划难忘旅程',
        },
        // FloatingIsland
        island: {
            startPlaceholder: '你在哪里？',
            endPlaceholder: '去哪里？',
            duration: '时长',
            days: '天',
            efficiency: '高效',
            serendipity: '探索',
            launch: '启动',
            calculating: '计算路线中...',
            expandPlanner: '规划新行程',
            collapse: '最小化',
            expand: '规划行程',
            vibeHints: {
                efficient: '直达路线，最少停靠',
                balanced: '速度与风景兼顾',
                serendipity: '风景路线，预计增加2小时',
            },
        },
        // WaypointPopup
        popup: {
            vibeCheck: '推荐理由',
            prevStop: '上一站',
            nextStop: '下一站',
            nearbyPlaces: '附近推荐',
            loadingNearby: '正在寻找附近景点...',
            within3km: '3公里内',
            noNearbyPlaces: '3公里内没有找到推荐地点',
            tryDifferentLocation: '试试选择其他经停点',
            types: {
                food: '美食',
                sight: '景点',
                shop: '购物',
                activity: '活动',
                other: '其他',
            },
        },
        // Map Controls
        map: {
            voidMode: '暗黑模式',
            lightMode: '明亮模式',
            satelliteMode: '卫星模式',
            resetView: '重置视图',
        },
        // Error Messages
        errors: {
            planningFailed: '规划行程失败。请检查您的API密钥后重试。',
            nearbyFailed: '加载附近推荐失败，请重试。',
        },
    },
};

export function getTranslation(lang: Language, key: string): string {
    const keys = key.split('.');
    let value: any = translations[lang];

    for (const k of keys) {
        value = value?.[k];
    }

    return value || key;
}
