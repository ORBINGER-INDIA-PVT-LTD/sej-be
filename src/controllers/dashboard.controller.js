import db from '../models/index.js';
import { Op } from 'sequelize';

export const getDashboardKPIs = async (req, res) => {
  try {
    const { month } = req.query; // format 'YYYY-MM'
    const now = new Date();
    
    let year = now.getFullYear();
    let monthNum = now.getMonth() + 1; // 1-12

    if (month && /^\d{4}-\d{2}$/.test(month)) {
      const parts = month.split('-');
      year = parseInt(parts[0], 10);
      monthNum = parseInt(parts[1], 10);
    }

    const startDateStr = `${year}-${String(monthNum).padStart(2, '0')}-01`;
    // Last day of month
    const lastDay = new Date(year, monthNum, 0).getDate();
    const endDateStr = `${year}-${String(monthNum).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

    const startDate = new Date(year, monthNum - 1, 1, 0, 0, 0, 0);
    const endDate = new Date(year, monthNum - 1, lastDay, 23, 59, 59, 999);

    const monthWhereDate = {
      date: {
        [Op.between]: [startDateStr, endDateStr]
      }
    };

    const monthWhereCreatedAt = {
      createdAt: {
        [Op.between]: [startDate, endDate]
      }
    };

    const [
      totalEmployees,
      tbtRecords,
      djpRecords,
      tlRecords,
      ppeRecords,
      attentionTools,
      attentionPPE,
      recentTools,
      recentPPE,
    ] = await Promise.all([
      db.Employee.count({ where: monthWhereCreatedAt }),
      db.ToolBoxTackle.findAll({ where: monthWhereDate, attributes: ['date'] }),
      db.DailyJobPlan.findAll({ where: monthWhereDate, attributes: ['date'] }),
      db.ToolsList.findAll({ where: monthWhereDate, attributes: ['date'] }),
      db.PpeInspection.findAll({ where: monthWhereDate, attributes: ['date'] }),
      db.ToolsListItem.count({
        where: {
          [Op.and]: [
            monthWhereCreatedAt,
            {
              [Op.or]: [
                { status: { [Op.like]: '%attention%' } },
                { status: { [Op.like]: '%not%' } },
                { status: { [Op.like]: '%reject%' } },
                { status: { [Op.like]: '%damage%' } },
                { status: { [Op.like]: '%fail%' } },
                { status: 'Attention Required' },
                { status: 'Not OK' }
              ]
            }
          ]
        }
      }),
      db.PpeInspectionItem.count({
        where: {
          [Op.and]: [
            monthWhereCreatedAt,
            {
              [Op.or]: [
                { status: { [Op.like]: '%attention%' } },
                { status: { [Op.like]: '%not%' } },
                { status: { [Op.like]: '%reject%' } },
                { status: { [Op.like]: '%damage%' } },
                { status: { [Op.like]: '%fail%' } },
                { status: 'Attention Required' },
                { status: 'Not OK' }
              ]
            }
          ]
        }
      }),
      db.ToolsList.findAll({
        limit: 5,
        order: [['createdAt', 'DESC']],
        attributes: ['id', 'permit_number', 'date', 'name_of_supervisor', 'createdAt']
      }),
      db.PpeInspection.findAll({
        limit: 5,
        order: [['createdAt', 'DESC']],
        attributes: ['id', 'permit_number', 'date', 'name_of_supervisor', 'createdAt']
      })
    ]);

    const recentInspections = [
      ...recentTools.map(t => ({
        id: `tool-${t.id}`,
        type: 'Tools Inspection',
        permit: t.permit_number,
        supervisor: t.name_of_supervisor || 'N/A',
        date: t.date || t.createdAt,
        createdAt: t.createdAt
      })),
      ...recentPPE.map(p => ({
        id: `ppe-${p.id}`,
        type: 'PPE Inspection',
        permit: p.permit_number,
        supervisor: p.name_of_supervisor || 'N/A',
        date: p.date || p.createdAt,
        createdAt: p.createdAt
      }))
    ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 6);

    const monthShort = new Date(year, monthNum - 1, 1).toLocaleString('en-US', { month: 'short' });

    const chartData = [];
    for (let d = 1; d <= lastDay; d++) {
      const dayStr = `${year}-${String(monthNum).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      
      const tbtCount = tbtRecords.filter(r => r.date && String(r.date).startsWith(dayStr)).length;
      const djpCount = djpRecords.filter(r => r.date && String(r.date).startsWith(dayStr)).length;
      const tlCount = tlRecords.filter(r => r.date && String(r.date).startsWith(dayStr)).length;
      const ppeCount = ppeRecords.filter(r => r.date && String(r.date).startsWith(dayStr)).length;

      chartData.push({
        day: d,
        date: dayStr,
        name: `${monthShort} ${d}`,
        "Tool Box Talk": tbtCount,
        "Daily Job Plan": djpCount,
        "Tools Inspection": tlCount,
        "PPE Inspection": ppeCount,
      });
    }

    const totalToolBoxTalks = tbtRecords.length;
    const totalDailyJobPlans = djpRecords.length;
    const totalToolsInspections = tlRecords.length;
    const totalPPEInspections = ppeRecords.length;

    let openPpeIssues = [];
    try {
      const ppeItems = await db.PpeInspectionItem.findAll({
        where: {
          [Op.or]: [
            { status: { [Op.like]: '%attention%' } },
            { status: { [Op.like]: '%not%' } },
            { status: { [Op.like]: '%reject%' } },
            { status: { [Op.like]: '%damage%' } },
            { status: { [Op.like]: '%fail%' } },
            { status: 'Attention Required' },
            { status: 'Not OK' }
          ]
        },
        order: [['createdAt', 'DESC']],
        limit: 6,
        include: [
          {
            model: db.PpeInspectionEmployee,
            as: 'employeeInspection',
            include: [
              { model: db.Employee, as: 'employee', attributes: ['emp_name', 'emp_id'] },
              { model: db.PpeInspection, as: 'ppeInspection', attributes: ['permit_number', 'date', 'type_of_work'] }
            ]
          }
        ]
      });

      openPpeIssues = ppeItems.map(item => ({
        id: item.id,
        itemName: item.ppe_item_name || 'PPE Item',
        status: item.status || 'Attention Required',
        description: item.description || '',
        employeeName: item.employeeInspection?.employee?.emp_name || 'N/A',
        permitNumber: item.employeeInspection?.ppeInspection?.permit_number || 'N/A',
        typeOfWork: item.employeeInspection?.ppeInspection?.type_of_work || 'N/A',
        date: item.createdAt
      }));
    } catch (err) {
      console.error("Error fetching open PPE issues:", err);
    }

    res.json({
      success: true,
      data: {
        totalEmployees,
        totalToolBoxTalks,
        totalDailyJobPlans,
        totalToolsInspections,
        totalPPEInspections,
        totalInspections: totalToolsInspections + totalPPEInspections,
        attentionTools: attentionTools || 0,
        attentionPPE: attentionPPE || 0,
        recentInspections,
        openPpeIssues,
        chartData
      }
    });
  } catch (error) {
    console.error("Error in getDashboardKPIs:", error);
    res.status(500).json({ success: false, message: "Failed to fetch dashboard KPIs" });
  }
};
