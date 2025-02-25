import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';

const prisma = new PrismaClient();

// GET /api/expenses/:id - Get a single expense by ID
export async function GET(request, { params }) {
  try {
    const session = await getServerSession();
    
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    
    const { id } = await params;
    
    const expense = await prisma.expense.findUnique({
      where: { id },
    });
    
    if (!expense) {
      return NextResponse.json({ error: 'Gasto no encontrado' }, { status: 404 });
    }
    
    // Check if the expense belongs to the authenticated user
    let userId = session.user?.id;
    
    if (!userId) {
      // Fallback for development
      const firstUser = await prisma.user.findFirst();
      if (firstUser) {
        userId = firstUser.id;
      }
    }
    
    if (expense.userId !== userId) {
      return NextResponse.json({ error: 'No tienes permiso para ver este gasto' }, { status: 403 });
    }
    
    return NextResponse.json(expense);
  } catch (error) {
    console.error('Error al obtener gasto:', error);
    return NextResponse.json({ error: 'Error al obtener gasto: ' + error.message }, { status: 500 });
  }
}

// PUT /api/expenses/:id - Update an expense
export async function PUT(request, { params }) {
  try {
    const session = await getServerSession();
    
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    
    const { id } = await params;
    const data = await request.json();
    
    // Validate required fields
    if (!data.amount || !data.description || !data.date) {
      return NextResponse.json({ 
        error: 'Los campos monto, descripción y fecha son obligatorios' 
      }, { status: 400 });
    }
    
    // Check if the expense exists
    const existingExpense = await prisma.expense.findUnique({
      where: { id },
    });
    
    if (!existingExpense) {
      return NextResponse.json({ error: 'Gasto no encontrado' }, { status: 404 });
    }
    
    // Check if the expense belongs to the authenticated user
    let userId = session.user?.id;
    
    if (!userId) {
      // Fallback for development
      const firstUser = await prisma.user.findFirst();
      if (firstUser) {
        userId = firstUser.id;
      }
    }
    
    if (existingExpense.userId !== userId) {
      return NextResponse.json({ 
        error: 'No tienes permiso para editar este gasto' 
      }, { status: 403 });
    }
    
    // Update the expense
    const updatedExpense = await prisma.expense.update({
      where: { id },
      data: {
        amount: data.amount,
        description: data.description,
        date: new Date(data.date),
        // We don't update the type - it should remain the same
      },
    });
    
    return NextResponse.json(updatedExpense);
  } catch (error) {
    console.error('Error al actualizar gasto:', error);
    return NextResponse.json({ 
      error: 'Error al actualizar gasto: ' + error.message 
    }, { status: 500 });
  }
}

// DELETE /api/expenses/:id - Delete an expense
export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession();
    
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    
    const { id } = params;
    
    // Check if the expense exists
    const existingExpense = await prisma.expense.findUnique({
      where: { id },
    });
    
    if (!existingExpense) {
      return NextResponse.json({ error: 'Gasto no encontrado' }, { status: 404 });
    }
    
    // Check if the expense belongs to the authenticated user
    let userId = session.user?.id;
    
    if (!userId) {
      // Fallback for development
      const firstUser = await prisma.user.findFirst();
      if (firstUser) {
        userId = firstUser.id;
      }
    }
    
    if (existingExpense.userId !== userId) {
      return NextResponse.json({ 
        error: 'No tienes permiso para eliminar este gasto' 
      }, { status: 403 });
    }
    
    // Delete the expense
    await prisma.expense.delete({
      where: { id },
    });
    
    return NextResponse.json({ 
      message: 'Gasto eliminado correctamente' 
    });
  } catch (error) {
    console.error('Error al eliminar gasto:', error);
    return NextResponse.json({ 
      error: 'Error al eliminar gasto: ' + error.message 
    }, { status: 500 });
  }
} 