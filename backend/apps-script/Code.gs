/**
 * Extensão OPCIONAL para gerar um Google Docs editável a partir de um
 * JSON já APROVADO no sistema. Executar dentro da conta do RH.
 * Nunca publicar doGet/doPost sem autenticação. A aplicação web gera impressão
 * A4 diretamente; esta extensão depende de configuração separada no Google.
 */
const BRASAO_DRIVE_FILE_ID = ''; // cole o ID do PNG do brasão, após enviá-lo ao Drive do RH
const DESTINO_DRIVE_FOLDER_ID = ''; // pasta do RH de destino
function gerarFolhaGoogleDocs(dados) {
  if (!dados || dados.status !== 'APROVADO' || !dados.validadoPorRH || !Array.isArray(dados.linhas)) {
    throw new Error('É preciso receber dados homologados pelo RH. Nunca importe uma prévia como documento oficial.');
  }
  if (!DESTINO_DRIVE_FOLDER_ID) throw new Error('Configure a pasta do Drive do RH.');
  const doc = DocumentApp.create('Folha de Ponto - ' + dados.mes + ' - ' + dados.matricula);
  const body = doc.getBody();
  body.setMarginTop(26).setMarginBottom(26).setMarginLeft(28).setMarginRight(28);
  if(BRASAO_DRIVE_FILE_ID){ try{ const im=body.appendImage(DriveApp.getFileById(BRASAO_DRIVE_FILE_ID).getBlob()); im.setWidth(55).setHeight(61); }catch(err){Logger.log('Não foi possível inserir logo: '+err.message);} }
  const cabe = [ 'ESTADO DE GOIÁS', 'MUNICÍPIO DE RIO VERDE', 'PREFEITURA MUNICIPAL DE RIO VERDE', 'Folha de ponto', dados.periodo, 'Referência: ' + dados.mes ];
  cabe.forEach((txt, i)=>{ const p=body.appendParagraph(txt);p.setAlignment(DocumentApp.HorizontalAlignment.CENTER);p.setSpacingAfter(0);p.editAsText().setFontFamily('Arial').setFontSize(9).setBold(i===3); });
  body.appendParagraph('Funcionário: '+dados.matricula+'   '+dados.nome).editAsText().setFontSize(9).setBold(true);
  body.appendParagraph('Cargo: '+(dados.cargo||'')+'       Data de admissão: '+(dados.admissao||'')).editAsText().setFontSize(9);
  body.appendParagraph('Lotação: '+(dados.lotacao||'')+'       Função: '+(dados.funcao||'')).editAsText().setFontSize(9);
  body.appendParagraph('Horário: 19:00 AS 07:00                     Escala: 12 / 36').editAsText().setFontSize(8);
  const tableData=[['DIA','SEMANA','1º Período','','2º Período','','EXTRA','','ASSINATURA']];
  for(const r of dados.linhas){tableData.push([String(r.dia),r.semana||'',r.entrada||'',r.segundaColuna||'________',r.saida||'',r.quartaColuna||'________','','','']);}
  const table=body.appendTable(tableData);
  for(let i=0;i<table.getNumRows();i++){const row=table.getRow(i); for(let j=0;j<row.getNumCells();j++){
    const cell=row.getCell(j);cell.editAsText().setFontFamily('Arial').setFontSize(7);cell.setPaddingTop(2).setPaddingBottom(2).setPaddingLeft(1).setPaddingRight(1);if(i%2===1)cell.setBackgroundColor('#e5e5e5');
    if(i===0)cell.editAsText().setBold(true);
  }}
  body.appendParagraph('________________________________________________________       ________________________________________________________');
  body.appendParagraph('              Assinatura Funcionário                          Assinatura Responsável');
  body.appendParagraph('Qtd. Faltas (dias): __________          Qtd. Faltas (horas): __________');
  body.appendParagraph('Identificação de fechamento RH: '+(dados.idFechamento||'')).editAsText().setFontSize(7);
  doc.saveAndClose();
  const destino=DriveApp.getFolderById(DESTINO_DRIVE_FOLDER_ID);const arq=DriveApp.getFileById(doc.getId());arq.moveTo(destino);
  const pdf=destino.createFile(arq.getAs(MimeType.PDF).setName(arq.getName()+'.pdf'));
  return {documento:doc.getUrl(),pdf:pdf.getUrl()};
}
