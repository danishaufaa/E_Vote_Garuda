import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const data = await request.json();

    // Jika pembayaran sukses
    if (data.transaction_status === 'settlement' || data.transaction_status === 'capture') {
      const order_id = data.order_id;

      // Ambil data troop_id dari transaksi ini
      const { data: trx } = await supabase
        .from('transactions')
        .select('troop_id, status')
        .eq('order_id', order_id)
        .single();

      // Jika transaksi masih PENDING, update jadi PAID dan tambah vote
      if (trx && trx.status === 'PENDING') {
        await supabase
          .from('transactions')
          .update({ status: 'PAID' })
          .eq('order_id', order_id);

        // Memanggil fungsi increment_vote yang kita buat di Supabase tadi
        await supabase.rpc('increment_vote', { row_id: trx.troop_id });
      }
    }

    return NextResponse.json({ status: 'ok' });
  } catch (error) {
    return NextResponse.json({ error: 'error' }, { status: 500 });
  }
}