const ADMIN_PRIORITY_THRESHOLD = 1000;
const USER_MAX_VISIBLE_VALUE = 500;

const csvFormatter = {
  header: () => 'ID,NOME,VALOR,USUARIO\n',
  row: (item, user) => `${item.id},${item.name},${item.value},${user.name}\n`,
  footer: (total) => `\nTotal,,\n${total},,\n`,
};

const htmlFormatter = {
  header: (user) =>
    '<html><body>\n' +
    '<h1>Relatório</h1>\n' +
    `<h2>Usuário: ${user.name}</h2>\n` +
    '<table>\n' +
    '<tr><th>ID</th><th>Nome</th><th>Valor</th></tr>\n',
  row: (item, _user, highlighted) => {
    const openTag = highlighted ? '<tr style="font-weight:bold;">' : '<tr>';
    return `${openTag}<td>${item.id}</td><td>${item.name}</td><td>${item.value}</td></tr>\n`;
  },
  footer: (total) => `</table>\n<h3>Total: ${total}</h3>\n</body></html>\n`,
};

const FORMATTERS = {
  CSV: csvFormatter,
  HTML: htmlFormatter,
};

const adminPolicy = {
  isVisible: () => true,
  prepare: (item) => {
    if (item.value > ADMIN_PRIORITY_THRESHOLD) {
      item.priority = true;
    }
  },
  isHighlighted: (item) => Boolean(item.priority),
};

const userPolicy = {
  isVisible: (item) => item.value <= USER_MAX_VISIBLE_VALUE,
  prepare: () => {},
  isHighlighted: () => false,
};

const ROLE_POLICIES = {
  ADMIN: adminPolicy,
  USER: userPolicy,
};

const lookup = (table, key) => (Object.hasOwn(table, key) ? table[key] : undefined);

function selectVisibleItems(policy, items) {
  if (!policy) {
    return [];
  }
  return items.filter((item) => {
    policy.prepare(item);
    return policy.isVisible(item);
  });
}

export class ReportGenerator {
  constructor(database) {
    this.db = database;
  }

  /**
   * Gera um relatório de itens baseado no tipo e no usuário.
   * - Admins veem tudo (itens acima de 1000 ganham destaque).
   * - Users comuns só veem itens com valor <= 500.
   */
  generateReport(reportType, user, items) {
    const formatter = lookup(FORMATTERS, reportType);
    if (!formatter) {
      return '';
    }

    const policy = lookup(ROLE_POLICIES, user.role);
    const visibleItems = selectVisibleItems(policy, items);

    const body = visibleItems
      .map((item) => formatter.row(item, user, policy.isHighlighted(item)))
      .join('');
    const total = visibleItems.reduce((sum, item) => sum + item.value, 0);

    return (formatter.header(user) + body + formatter.footer(total)).trim();
  }
}
