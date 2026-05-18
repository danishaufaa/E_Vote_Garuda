import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
// @ts-ignore
import midtransClient from 'midtrans-client';

export async function POST(request: Request) {
  try {
    const { nama_voter, troop_id } = await request.json();
    
    // ID Transaksi unik untuk Midtrans
    const order_id = `VOTE-${Date.now()}`;

    // 1. Simpan data transaksi awal ke Supabase
    const { error: dbError } = await supabase
      .from('transactions')
      .insert([{ order_id, nama_voter, troop_id, status: 'PENDING' }]);

    if (dbError) throw dbError;

    // 2. Minta QRIS ke Midtrans
    const snap = new midtransClient.Snap({
      isProduction: false,
      serverKey: process.env.MIDTRANS_SERVER_KEY,
    });

    const parameter = {
      transaction_details: {
        order_id: order_id,
        gross_amount: 1000, // Harga per 1 vote (Misal Rp 1.000)
      },
      customer_details: { first_name: nama_voter },
      // enabled_payments: ["other_qris", "qris"], // Fokuskan ke QRIS
    };

    const transaction = await snap.createTransaction(parameter);
    
    return NextResponse.json({ redirect_url: transaction.redirect_url });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Gagal memproses' }, { status: 500 });
  }
}