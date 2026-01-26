export interface Keyword {
    id: string;
    term: string;
    ranking?: {
        currentPosition: number;
    };
}

export interface Page {
    id: string;
    title: string;
    url: string;
}

export interface RankHistory {
    date: Date;
    position: number;
}

export interface AuditLog {
    id: string;
    action: string;
    entity: {
        name: string;
    };
    createdAt: Date | string;
}
