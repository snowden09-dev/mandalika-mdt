import { NextResponse } from 'next/server';

export async function GET() {
    const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
    const CLIENT_ID = process.env.DISCORD_CLIENT_ID;
    const GUILD_ID = process.env.DISCORD_GUILD_ID;
    if (!BOT_TOKEN || !CLIENT_ID || !GUILD_ID) {
        return NextResponse.json({ 
            error: "Token, Client ID, atau Guild ID belum lengkap di environment variables!" 
        }, { status: 400 });
    }

    const url = `https://discord.com/api/v10/applications/${CLIENT_ID}/guilds/${GUILD_ID}/commands`;

    const commandData = {
        name: "absen",
        description: "Form laporan absensi duty kepolisian",
    };

    const response = await fetch(url, {
        method: "POST",
        headers: {
            Authorization: `Bot ${BOT_TOKEN}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify(commandData),
    });

    if (!response.ok) {
        const errorText = await response.text();
        return NextResponse.json({ success: false, error: errorText }, { status: 500 });
    }

    const result = await response.json();
    return NextResponse.json({ 
        success: true, 
        message: "Perintah /absen berhasil didaftarkan ke server Discord!", 
        data: result 
    });
}