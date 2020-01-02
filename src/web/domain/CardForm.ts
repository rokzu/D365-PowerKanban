interface FieldLabel {
    label: string;
    lcid: string;
}

interface CardCell {
    field: string;
    labels: Array<FieldLabel>;
}

interface CardRow {
    cells: Array<CardCell>;
}

interface CardSegment {
    rows: Array<CardRow>;
}

interface ParsedCard {
    header: CardSegment;
    body: CardSegment;
    footer: CardSegment;
}

export interface CardForm {
    formxml: string;
    name: string;
    formid: string;
    parsed: ParsedCard;
}

const parseSegment = (segment: HTMLElement): CardSegment => {
    const rows: Array<CardRow> = Array.from(segment.getElementsByTagName("row"))
    .map(r =>
        ({ cells: Array.from(r.getElementsByTagName("cell"))
            .map(c => {
                const controls = Array.from(c.getElementsByTagName("control"));

                if (!controls.length) {
                return undefined;
                }

                const control = controls[0];

                return {
                    field: control.getAttribute("datafieldname"),
                    labels: Array.from((control.previousSibling as Element).getElementsByTagName("label")).map(l => ({ label: l.getAttribute("description"), lcid: l.getAttribute("languagecode") }))
                };
            })
        .filter(c => c)
        })
    );

    return {
        rows
    };
};

export const parseCardForm = (form: CardForm): ParsedCard => {
    const parser = new DOMParser();
    const xml = parser.parseFromString(form.formxml, "application/xml");

    const sections = Array.from(xml.documentElement.getElementsByTagName("section"));

    const header = sections.find(s => s.getAttribute("name") === "CardHeader");
    const body = sections.find(s => s.getAttribute("name") === "CardDetails");
    const footer = sections.find(s => s.getAttribute("name") === "CardFooter");

    return {
        header: parseSegment(header),
        body: parseSegment(body),
        footer: parseSegment(footer)
    };
};