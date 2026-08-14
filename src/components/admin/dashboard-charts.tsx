"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function DashboardCharts({
  porProvincia,
  porEspecialidad,
}: {
  porProvincia: { nombre: string; total: number }[];
  porEspecialidad: { nombre: string; total: number }[];
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Abogados por provincia</CardTitle>
        </CardHeader>
        <CardContent className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={porProvincia} margin={{ left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis
                dataKey="nombre"
                tick={{ fontSize: 11 }}
                interval={0}
                angle={-35}
                textAnchor="end"
                height={70}
              />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="total" fill="var(--color-primary)" radius={4} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Top especialidades</CardTitle>
        </CardHeader>
        <CardContent className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={porEspecialidad} layout="vertical" margin={{ left: 24 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
              <YAxis
                type="category"
                dataKey="nombre"
                tick={{ fontSize: 11 }}
                width={140}
              />
              <Tooltip />
              <Bar dataKey="total" fill="var(--color-primary)" radius={4} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
