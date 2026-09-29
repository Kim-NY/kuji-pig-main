'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

export default function UserStatsPage() {
  const [userList, setUserList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    calculateUserStats();
  }, []);

  const calculateUserStats = async () => {
    setLoading(true);

    // 1. DB에서 데이터 일괄 조회
    const [usersRes, setRes, shipRes] = await Promise.all([
      supabase.from('users').select('*'),
      supabase.from('settlements').select('nickname, figure_name, g_count, i_count'),
      supabase.from('shipments').select('nickname, figure_name, g_count'),
    ]);

    const users = usersRes.data || [];
    const settlements = setRes.data || [];
    const shipments = shipRes.data || [];

    // 2. 유저별 피규어/랭굿 차감 연산
    const computedUsers = users.map((u) => {
      const uSets = settlements.filter((s) => s.nickname === u.nickname);
      const uShips = shipments.filter((s) => s.nickname === u.nickname);

      // (1) 피규어 수량 차감 계산
      const acquiredFigures = uSets.map((s) => s.figure_name).filter(Boolean);
      const shippedFigures = uShips.map((s) => s.figure_name).filter(Boolean);

      const holdingFigures = [...acquiredFigures];
      shippedFigures.forEach((shipped) => {
        const idx = holdingFigures.indexOf(shipped);
        if (idx > -1) holdingFigures.splice(idx, 1);
      });

      // (2) 랭굿 계산: (획득 랭굿 - 사용 랭굿) - 출고 랭굿
      const totalG = uSets.reduce((acc, cur) => acc + (cur.g_count || 0), 0);
      const totalI = uSets.reduce((acc, cur) => acc + (cur.i_count || 0), 0);
      const totalShipG = uShips.reduce((acc, cur) => acc + (cur.g_count || 0), 0);

      const remainRangut = totalG - totalI - totalShipG;
      const points = remainRangut * 500;

      return {
        ...u,
        holdingFigures: holdingFigures.join(', '),
        remainRangut,
        points,
      };
    });

    setUserList(computedUsers);
    setLoading(false);
  };

  const filteredList = userList.filter(
    (u) => u.nickname.includes(search) || (u.name && u.name.includes(search))
  );

  return (
    <div className="p-8 space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">개인정보 및 보유 현황</h1>
        <input
          type="text"
          placeholder="닉네임/이름 검색..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border p-2 rounded w-64"
        />
      </div>

      {loading ? (
        <p>데이터 연산 중...</p>
      ) : (
        <div className="overflow-x-auto border rounded-lg">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-100 border-b">
              <tr>
                <th className="p-3">이름</th>
                <th className="p-3">닉네임</th>
                <th className="p-3">전화번호</th>
                <th className="p-3">보유 피규어</th>
                <th className="p-3 text-right">보유 랭굿 수량</th>
                <th className="p-3 text-right">포인트</th>
              </tr>
            </thead>
            <tbody>
              {filteredList.map((u) => (
                <tr key={u.nickname} className="border-b hover:bg-gray-50">
                  <td className="p-3">{u.name || '-'}</td>
                  <td className="p-3 font-semibold">{u.nickname}</td>
                  <td className="p-3">{u.phone || '-'}</td>
                  <td className="p-3 max-w-md truncate">{u.holdingFigures || '-'}</td>
                  <td className="p-3 text-right font-bold text-blue-600">{u.remainRangut}</td>
                  <td className="p-3 text-right font-bold">{u.points.toLocaleString()} P</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
