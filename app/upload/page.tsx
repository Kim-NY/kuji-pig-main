'use client';

import { useState } from 'react';
import * as XLSX from 'xlsx';
import { supabase } from '@/lib/supabase';

export default function UploadPage() {
  const [loading, setLoading] = useState(false);

  const handleExcelUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: 'settlements' | 'shipments'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    const reader = new FileReader();

    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsName = wb.SheetNames[0];
        const data = XLSX.utils.sheet_to_json<any>(wb.Sheets[wsName]);

        let formattedData = [];

        if (type === 'settlements') {
          formattedData = data.map((row) => ({
            date: row['날짜'] || null,
            nickname: String(row['닉네임'] || '').trim(),
            figure_name: row['획득 피규어'] || row['획득 피규어(제조사)'] || '',
            manufacturer: row['제조사'] || '',
            g_count: Number(row['획득 랭굿 수량'] || 0),
            i_count: Number(row['사용 랭굿 수량'] || 0),
            points: Number(row['포인트'] || 0),
            memo: row['비고'] || '',
          }));
        } else {
          formattedData = data.map((row) => ({
            date: row['날짜'] || null,
            nickname: String(row['닉네임'] || '').trim(),
            figure_name: row['출고 피규어'] || '',
            g_count: Number(row['출고 랭굿 수량'] || 0),
            free_shipping: Boolean(row['무료배송']),
            tracking_number: String(row['송장번호'] || ''),
          }));
        }

        const { error } = await supabase.from(type).insert(formattedData);

        if (error) throw error;
        alert(`${formattedData.length}건 대량 업로드 성공!`);
      } catch (err: any) {
        alert('업로드 중 오류 발생: ' + err.message);
      } finally {
        setLoading(false);
      }
    };

    reader.readAsBinaryString(file);
  };

  return (
    <div className="p-8 max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">엑셀 데이터 대량 업로드</h1>

      <div className="border p-4 rounded-lg bg-white shadow-sm space-y-2">
        <label className="block font-semibold">1. 정산내역 엑셀 업로드</label>
        <input
          type="file"
          accept=".xlsx, .xls, .csv"
          disabled={loading}
          onChange={(e) => handleExcelUpload(e, 'settlements')}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
      </div>

      <div className="border p-4 rounded-lg bg-white shadow-sm space-y-2">
        <label className="block font-semibold">2. 출고현황 엑셀 업로드</label>
        <input
          type="file"
          accept=".xlsx, .xls, .csv"
          disabled={loading}
          onChange={(e) => handleExcelUpload(e, 'shipments')}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
        />
      </div>

      {loading && <p className="text-blue-600 font-bold">데이터 분석 및 DB 저장 중...</p>}
    </div>
  );
}
