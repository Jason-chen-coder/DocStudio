import { TemplateCategory } from '@prisma/client';

export interface SystemTemplateSeed {
  name: string;
  description: string;
  icon: string;
  category: TemplateCategory;
  sortOrder: number;
  content: string;
}

export const SYSTEM_TEMPLATES: SystemTemplateSeed[] = [
  {
    name: '会议记录',
    description: '标准会议记录模板，包含议程、讨论要点和行动项',
    icon: '📋',
    category: 'MEETING',
    sortOrder: 1,
    content: JSON.stringify({
      type: 'doc',
      content: [
        {
          type: 'heading',
          attrs: { level: 1 },
          content: [{ type: 'text', text: '会议记录' }],
        },
        {
          type: 'paragraph',
          content: [
            { type: 'text', marks: [{ type: 'bold' }], text: '日期：' },
            { type: 'text', text: 'YYYY-MM-DD' },
          ],
        },
        {
          type: 'paragraph',
          content: [
            { type: 'text', marks: [{ type: 'bold' }], text: '参会人员：' },
            { type: 'text', text: '请列出参会人员' },
          ],
        },
        {
          type: 'paragraph',
          content: [
            { type: 'text', marks: [{ type: 'bold' }], text: '会议主题：' },
            { type: 'text', text: '请填写会议主题' },
          ],
        },
        { type: 'horizontalRule' },
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: '议程' }],
        },
        {
          type: 'orderedList',
          content: [
            {
              type: 'listItem',
              content: [
                {
                  type: 'paragraph',
                  content: [{ type: 'text', text: '议题一' }],
                },
              ],
            },
            {
              type: 'listItem',
              content: [
                {
                  type: 'paragraph',
                  content: [{ type: 'text', text: '议题二' }],
                },
              ],
            },
            {
              type: 'listItem',
              content: [
                {
                  type: 'paragraph',
                  content: [{ type: 'text', text: '议题三' }],
                },
              ],
            },
          ],
        },
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: '讨论要点' }],
        },
        {
          type: 'bulletList',
          content: [
            {
              type: 'listItem',
              content: [
                {
                  type: 'paragraph',
                  content: [{ type: 'text', text: '要点一' }],
                },
              ],
            },
            {
              type: 'listItem',
              content: [
                {
                  type: 'paragraph',
                  content: [{ type: 'text', text: '要点二' }],
                },
              ],
            },
          ],
        },
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: '行动项' }],
        },
        {
          type: 'taskList',
          content: [
            {
              type: 'taskItem',
              attrs: { checked: false },
              content: [
                {
                  type: 'paragraph',
                  content: [
                    { type: 'text', text: '行动项一 - 负责人：XXX，截止日期：YYYY-MM-DD' },
                  ],
                },
              ],
            },
            {
              type: 'taskItem',
              attrs: { checked: false },
              content: [
                {
                  type: 'paragraph',
                  content: [
                    { type: 'text', text: '行动项二 - 负责人：XXX，截止日期：YYYY-MM-DD' },
                  ],
                },
              ],
            },
          ],
        },
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: '下次会议' }],
        },
        {
          type: 'paragraph',
          content: [
            { type: 'text', marks: [{ type: 'bold' }], text: '时间：' },
            { type: 'text', text: '待定' },
          ],
        },
        {
          type: 'paragraph',
          content: [
            { type: 'text', marks: [{ type: 'bold' }], text: '主题：' },
            { type: 'text', text: '待定' },
          ],
        },
      ],
    }),
  },
  {
    name: '技术方案',
    description: '技术方案设计文档模板，包含背景、方案设计、风险评估等',
    icon: '🏗️',
    category: 'TECH',
    sortOrder: 2,
    content: JSON.stringify({
      type: 'doc',
      content: [
        {
          type: 'heading',
          attrs: { level: 1 },
          content: [{ type: 'text', text: '技术方案 - [项目名称]' }],
        },
        {
          type: 'paragraph',
          content: [
            { type: 'text', marks: [{ type: 'bold' }], text: '作者：' },
            { type: 'text', text: '请填写作者' },
          ],
        },
        {
          type: 'paragraph',
          content: [
            { type: 'text', marks: [{ type: 'bold' }], text: '日期：' },
            { type: 'text', text: 'YYYY-MM-DD' },
          ],
        },
        {
          type: 'paragraph',
          content: [
            { type: 'text', marks: [{ type: 'bold' }], text: '状态：' },
            { type: 'text', text: '草稿 / 评审中 / 已通过' },
          ],
        },
        { type: 'horizontalRule' },
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: '背景与目标' }],
        },
        {
          type: 'paragraph',
          content: [{ type: 'text', text: '描述项目背景和需要解决的问题，以及本方案的目标。' }],
        },
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: '方案设计' }],
        },
        {
          type: 'heading',
          attrs: { level: 3 },
          content: [{ type: 'text', text: '整体架构' }],
        },
        {
          type: 'paragraph',
          content: [{ type: 'text', text: '描述整体架构设计，可配合架构图说明。' }],
        },
        {
          type: 'heading',
          attrs: { level: 3 },
          content: [{ type: 'text', text: '核心流程' }],
        },
        {
          type: 'paragraph',
          content: [{ type: 'text', text: '描述核心业务流程和数据流。' }],
        },
        {
          type: 'heading',
          attrs: { level: 3 },
          content: [{ type: 'text', text: '技术选型' }],
        },
        {
          type: 'paragraph',
          content: [{ type: 'text', text: '列出关键技术选型及理由。' }],
        },
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: '详细设计' }],
        },
        {
          type: 'paragraph',
          content: [{ type: 'text', text: '包含接口设计、数据库设计、关键算法等详细内容。' }],
        },
        {
          type: 'codeBlock',
          attrs: { language: 'typescript' },
          content: [{ type: 'text', text: '// 示例代码\n' }],
        },
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: '风险评估' }],
        },
        {
          type: 'bulletList',
          content: [
            {
              type: 'listItem',
              content: [
                {
                  type: 'paragraph',
                  content: [
                    { type: 'text', marks: [{ type: 'bold' }], text: '风险一：' },
                    { type: 'text', text: '描述风险及应对措施' },
                  ],
                },
              ],
            },
            {
              type: 'listItem',
              content: [
                {
                  type: 'paragraph',
                  content: [
                    { type: 'text', marks: [{ type: 'bold' }], text: '风险二：' },
                    { type: 'text', text: '描述风险及应对措施' },
                  ],
                },
              ],
            },
          ],
        },
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: '排期' }],
        },
        {
          type: 'bulletList',
          content: [
            {
              type: 'listItem',
              content: [
                {
                  type: 'paragraph',
                  content: [{ type: 'text', text: '阶段一：XXX（X天）' }],
                },
              ],
            },
            {
              type: 'listItem',
              content: [
                {
                  type: 'paragraph',
                  content: [{ type: 'text', text: '阶段二：XXX（X天）' }],
                },
              ],
            },
          ],
        },
      ],
    }),
  },
  {
    name: '周报',
    description: '每周工作汇报模板，包含完成事项、计划和数据指标',
    icon: '📊',
    category: 'REPORT',
    sortOrder: 3,
    content: JSON.stringify({
      type: 'doc',
      content: [
        {
          type: 'heading',
          attrs: { level: 1 },
          content: [{ type: 'text', text: '周报 - 第 XX 周（MM.DD - MM.DD）' }],
        },
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: '本周完成' }],
        },
        {
          type: 'bulletList',
          content: [
            {
              type: 'listItem',
              content: [
                {
                  type: 'paragraph',
                  content: [{ type: 'text', text: '完成事项一' }],
                },
              ],
            },
            {
              type: 'listItem',
              content: [
                {
                  type: 'paragraph',
                  content: [{ type: 'text', text: '完成事项二' }],
                },
              ],
            },
            {
              type: 'listItem',
              content: [
                {
                  type: 'paragraph',
                  content: [{ type: 'text', text: '完成事项三' }],
                },
              ],
            },
          ],
        },
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: '下周计划' }],
        },
        {
          type: 'bulletList',
          content: [
            {
              type: 'listItem',
              content: [
                {
                  type: 'paragraph',
                  content: [{ type: 'text', text: '计划事项一' }],
                },
              ],
            },
            {
              type: 'listItem',
              content: [
                {
                  type: 'paragraph',
                  content: [{ type: 'text', text: '计划事项二' }],
                },
              ],
            },
          ],
        },
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: '问题与风险' }],
        },
        {
          type: 'paragraph',
          content: [{ type: 'text', text: '记录本周遇到的问题和潜在风险，以及需要的支持。' }],
        },
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: '数据指标' }],
        },
        {
          type: 'paragraph',
          content: [{ type: 'text', text: '列出本周关键数据指标及变化趋势。' }],
        },
      ],
    }),
  },
  {
    name: '需求文档',
    description: 'PRD需求文档模板，包含需求背景、用户故事、验收标准等',
    icon: '📐',
    category: 'REQUIREMENT',
    sortOrder: 4,
    content: JSON.stringify({
      type: 'doc',
      content: [
        {
          type: 'heading',
          attrs: { level: 1 },
          content: [{ type: 'text', text: 'PRD - [需求名称]' }],
        },
        {
          type: 'paragraph',
          content: [
            { type: 'text', marks: [{ type: 'bold' }], text: '产品经理：' },
            { type: 'text', text: '请填写' },
          ],
        },
        {
          type: 'paragraph',
          content: [
            { type: 'text', marks: [{ type: 'bold' }], text: '版本：' },
            { type: 'text', text: 'v1.0' },
          ],
        },
        {
          type: 'paragraph',
          content: [
            { type: 'text', marks: [{ type: 'bold' }], text: '日期：' },
            { type: 'text', text: 'YYYY-MM-DD' },
          ],
        },
        { type: 'horizontalRule' },
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: '需求背景' }],
        },
        {
          type: 'paragraph',
          content: [{ type: 'text', text: '描述需求产生的背景、业务场景和用户痛点。' }],
        },
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: '需求概述' }],
        },
        {
          type: 'paragraph',
          content: [{ type: 'text', text: '简要描述需求的核心内容。' }],
        },
        {
          type: 'blockquote',
          content: [
            {
              type: 'paragraph',
              content: [
                { type: 'text', marks: [{ type: 'bold' }], text: '用户故事：' },
                { type: 'text', text: '作为 [角色]，我希望 [功能]，以便 [价值]。' },
              ],
            },
          ],
        },
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: '详细设计' }],
        },
        {
          type: 'paragraph',
          content: [{ type: 'text', text: '包含功能描述、交互设计、页面原型等详细内容。' }],
        },
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: '非功能需求' }],
        },
        {
          type: 'bulletList',
          content: [
            {
              type: 'listItem',
              content: [
                {
                  type: 'paragraph',
                  content: [
                    { type: 'text', marks: [{ type: 'bold' }], text: '性能：' },
                    { type: 'text', text: '页面加载时间 < 2s' },
                  ],
                },
              ],
            },
            {
              type: 'listItem',
              content: [
                {
                  type: 'paragraph',
                  content: [
                    { type: 'text', marks: [{ type: 'bold' }], text: '兼容性：' },
                    { type: 'text', text: '支持主流浏览器' },
                  ],
                },
              ],
            },
            {
              type: 'listItem',
              content: [
                {
                  type: 'paragraph',
                  content: [
                    { type: 'text', marks: [{ type: 'bold' }], text: '安全性：' },
                    { type: 'text', text: '数据加密传输' },
                  ],
                },
              ],
            },
          ],
        },
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: '验收标准' }],
        },
        {
          type: 'taskList',
          content: [
            {
              type: 'taskItem',
              attrs: { checked: false },
              content: [
                {
                  type: 'paragraph',
                  content: [{ type: 'text', text: '验收条件一' }],
                },
              ],
            },
            {
              type: 'taskItem',
              attrs: { checked: false },
              content: [
                {
                  type: 'paragraph',
                  content: [{ type: 'text', text: '验收条件二' }],
                },
              ],
            },
            {
              type: 'taskItem',
              attrs: { checked: false },
              content: [
                {
                  type: 'paragraph',
                  content: [{ type: 'text', text: '验收条件三' }],
                },
              ],
            },
          ],
        },
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: '排期' }],
        },
        {
          type: 'bulletList',
          content: [
            {
              type: 'listItem',
              content: [
                {
                  type: 'paragraph',
                  content: [{ type: 'text', text: '设计阶段：X天' }],
                },
              ],
            },
            {
              type: 'listItem',
              content: [
                {
                  type: 'paragraph',
                  content: [{ type: 'text', text: '开发阶段：X天' }],
                },
              ],
            },
            {
              type: 'listItem',
              content: [
                {
                  type: 'paragraph',
                  content: [{ type: 'text', text: '测试阶段：X天' }],
                },
              ],
            },
          ],
        },
      ],
    }),
  },
  {
    name: '操作指南',
    description: '操作指南文档模板，包含步骤说明、常见问题和注意事项',
    icon: '📖',
    category: 'GUIDE',
    sortOrder: 5,
    content: JSON.stringify({
      type: 'doc',
      content: [
        {
          type: 'heading',
          attrs: { level: 1 },
          content: [{ type: 'text', text: '操作指南 - [标题]' }],
        },
        {
          type: 'paragraph',
          content: [
            { type: 'text', marks: [{ type: 'bold' }], text: '版本：' },
            { type: 'text', text: 'v1.0' },
          ],
        },
        {
          type: 'paragraph',
          content: [
            { type: 'text', marks: [{ type: 'bold' }], text: '更新日期：' },
            { type: 'text', text: 'YYYY-MM-DD' },
          ],
        },
        { type: 'horizontalRule' },
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: '概述' }],
        },
        {
          type: 'paragraph',
          content: [{ type: 'text', text: '简要介绍本指南的目的和适用范围。' }],
        },
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: '前置条件' }],
        },
        {
          type: 'bulletList',
          content: [
            {
              type: 'listItem',
              content: [
                {
                  type: 'paragraph',
                  content: [{ type: 'text', text: '条件一：描述所需的环境或权限' }],
                },
              ],
            },
            {
              type: 'listItem',
              content: [
                {
                  type: 'paragraph',
                  content: [{ type: 'text', text: '条件二：描述所需的工具或配置' }],
                },
              ],
            },
          ],
        },
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: '操作步骤' }],
        },
        {
          type: 'heading',
          attrs: { level: 3 },
          content: [{ type: 'text', text: '步骤一：准备工作' }],
        },
        {
          type: 'paragraph',
          content: [{ type: 'text', text: '详细描述第一步操作。' }],
        },
        {
          type: 'heading',
          attrs: { level: 3 },
          content: [{ type: 'text', text: '步骤二：执行操作' }],
        },
        {
          type: 'paragraph',
          content: [{ type: 'text', text: '详细描述第二步操作。' }],
        },
        {
          type: 'heading',
          attrs: { level: 3 },
          content: [{ type: 'text', text: '步骤三：验证结果' }],
        },
        {
          type: 'paragraph',
          content: [{ type: 'text', text: '描述如何验证操作是否成功。' }],
        },
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: '常见问题' }],
        },
        {
          type: 'heading',
          attrs: { level: 3 },
          content: [{ type: 'text', text: 'Q: 问题描述？' }],
        },
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'A: 解答内容。' }],
        },
        {
          type: 'heading',
          attrs: { level: 3 },
          content: [{ type: 'text', text: 'Q: 另一个常见问题？' }],
        },
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'A: 解答内容。' }],
        },
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: '注意事项' }],
        },
        {
          type: 'blockquote',
          content: [
            {
              type: 'paragraph',
              content: [
                { type: 'text', marks: [{ type: 'bold' }], text: '重要提示：' },
                { type: 'text', text: '请在操作前备份相关数据，确保操作环境安全。' },
              ],
            },
          ],
        },
      ],
    }),
  },
];
