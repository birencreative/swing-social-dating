export interface PartnerEvent {
    id: string;
    slug_name?: string;
    what: {
        title: string;
        seoTitle?: string;
        description?: string;
        seoDescription?: string;
        type?: string;
        url?: string;
        image?: string;
    };
    when: {
        date: string;
        time: string;
        rawDate?: string;
    };
    where: {
        name: string;
        location: string;
        distance: string;
        streetAddress?: string;
        city?: string;
        state?: string;
    };
    who: {
        name: string;
        profileUrl?: string;
        hostPic?: string;
        contact?: string;
    };
    venuePics?: string[];
}