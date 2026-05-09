import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function POST(req: Request) {
    try {
        const { userId } = await req.json();
        const botToken = process.env.DISCORD_BOT_TOKEN;
        const guildId = process.env.DISCORD_GUILD_ID;

        const res = await fetch(`https://discord.com/api/v10/guilds/${guildId}/members/${userId}`, {
            headers: { Authorization: `Bot ${botToken}` },
            next: { revalidate: 0 }
        });

        if (!res.ok) return NextResponse.json({ isPolice: false });
        const member = await res.json();
        const roles = member.roles;

        // DAFTAR PANGKAT (Tertinggi ke Terendah)
        const RANK_HIERARCHY = [
            { name: "JENDRAL", id: "1393368961940324462" }, { name: "KOMJEN", id: "1393369949988327624" },
            { name: "IRJEN", id: "1393371303779500154" }, { name: "BRIGJEN", id: "1393373068709335121" },
            { name: "KOMBESPOL", id: "1393373724756934756" }, { name: "AKBP", id: "1393374382293782689" },
            { name: "KOMPOL", id: "1393374719608094902" }, { name: "AKP", id: "1393375242860232826" },
            { name: "IPTU", id: "1393375424754487376" }, { name: "IPDA", id: "1393376012858818622" },
            { name: "AIPTU", id: "1393376194640216204" }, { name: "AIPDA", id: "1393376395161239552" },
            { name: "BRIPKA", id: "1393376709990027365" }, { name: "BRIPTU", id: "1393376930384052345" },
            { name: "BRIPDA", id: "1393377097673736264" }, { name: "ABRIPDA", id: "1447257983729008823" },
            { name: "ABRIPTU", id: "1447257808595587173" }, { name: "ABRIGPOL", id: "1468235299346845726" },
            { name: "BHARAKA", id: "1468236252028469552" }, { name: "BHARATU", id: "1414436319873994863" },
            { name: "BHARADA", id: "1414436059806302339" }, { name: "BRIGPOL", id: "1428799768045420706" },
        ];

        let detectedPangkat = "RECRUIT";
        for (const rank of RANK_HIERARCHY) {
            if (roles.includes(rank.id)) { detectedPangkat = rank.name; break; }
        }

        // 🚀 LOGIKA DIVISI DIPERBAIKI
        // Petinggi dihapus dari sini agar tidak menabrak Divisi utama (seperti Satlantas)
        const DIVISI_ID = {
            PROPAM: "1458009275472281672",
            BRIMOB: "1417238500025040987",
            SATLANTAS: "1427725693126574121",
            SABHARA: "1423062503646298262"
        };

        // Default diatur ke NON DIVISI
        let detectedDivisi = "NON DIVISI";
        for (const [name, id] of Object.entries(DIVISI_ID)) {
            if (roles.includes(id)) { detectedDivisi = name; break; }
        }

        const isPolice = roles.includes("1393366590942085220");

        if (isPolice) {
            await supabaseAdmin.from('users').upsert({
                id: userId,
                discord_id: userId,
                name: member.nick || member.user.username,
                image: member.user.avatar ? `https://cdn.discordapp.com/avatars/${userId}/${member.user.avatar}.png` : null,
                roles: roles,
                divisi: detectedDivisi,
                pangkat: detectedPangkat,
                last_login: new Date().toISOString(),
            }, { onConflict: 'discord_id' });
        }

        return NextResponse.json({ isPolice, divisi: detectedDivisi, pangkat: detectedPangkat, discord_id: userId });
    } catch (err) {
        return NextResponse.json({ error: "Fail" }, { status: 500 });
    }
}