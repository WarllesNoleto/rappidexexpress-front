/* eslint-disable @typescript-eslint/no-explicit-any */
import { useContext, useEffect, useMemo, useState } from 'react';

import { DeliveryContext } from '../../context/DeliveryContext';
import api from '../../services/api';
import { Loader } from '../../components/Loader';
import { User } from '../../shared/interfaces';
import { formatIfoodHistoryDateTime, translateIfoodOperationType } from '../../shared/utils/ifoodHistory.ts';
import {
  Actions,
  CreditButton,
  CreditButtons,
  CreditInput,
  CreditLine,
  CreditSummary,
  Card,
  Checkbox,
  Container,
  Content,
  Input,
  LoadingContainer,
  MerchantIdLabel,
  SaveButton,
  ShopkeeperName,
  Subtitle,
  Title,
  HistoryButton,
  HistoryItem,
  HistoryList,
  LoadMoreButton,
  EmptyState,
} from './styles.ts';

export function IfoodClients() {
  const { token } = useContext(DeliveryContext);
  api.defaults.headers.Authorization = `Bearer ${token}`;

  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [savingUser, setSavingUser] = useState('');
  const [shopkeepers, setShopkeepers] = useState<User[]>([]);
  const [creditAmountByUser, setCreditAmountByUser] = useState<Record<string, number>>({});
  const [historyByUser, setHistoryByUser] = useState<Record<string, any[]>>({});
  const [loadingHistoryUser, setLoadingHistoryUser] = useState('');
  const [page, setPage] = useState(1);
  const [hasMoreShopkeepers, setHasMoreShopkeepers] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');

  const filteredShopkeepers = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    if (!normalizedSearch) {
      return shopkeepers;
    }

    return shopkeepers.filter((shopkeeper) =>
      (shopkeeper.name || '').toLowerCase().includes(normalizedSearch),
    );
  }, [shopkeepers, searchTerm]);

  const ITEMS_PER_PAGE = 200;

  async function loadShopkeepers(targetPage = 1, shouldAppend = false) {
    if (shouldAppend) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }

    try {
      const usersResponse = await api.get(
        `/user?type=shopkeeper&page=${targetPage}&itemsPerPage=${ITEMS_PER_PAGE}`,
      );
      const users = Array.isArray(usersResponse.data?.data)
        ? usersResponse.data.data
        : [];

      setShopkeepers((currentUsers) =>
        shouldAppend ? [...currentUsers, ...users] : users,
      );
      setPage(targetPage);
      setHasMoreShopkeepers(users.length === ITEMS_PER_PAGE);
    } catch (error: any) {
      alert(error?.response?.data?.message || 'Erro ao buscar lojistas.');
    } finally {
      if (shouldAppend) {
        setLoadingMore(false);
      } else {
        setLoading(false);
      }
    }
  }

  async function loadAllShopkeepers() {
    setIsSearching(true);

    try {
      let targetPage = 1;
      let hasMore = true;
      const allUsers: User[] = [];

      while (hasMore) {
        const usersResponse = await api.get(
          `/user?type=shopkeeper&page=${targetPage}&itemsPerPage=${ITEMS_PER_PAGE}`,
        );

        const users = Array.isArray(usersResponse.data?.data)
          ? usersResponse.data.data
          : [];

        allUsers.push(...users);
        hasMore = users.length === ITEMS_PER_PAGE;
        targetPage += 1;
      }

      setShopkeepers(allUsers);
      setPage(1);
      setHasMoreShopkeepers(false);
    } catch (error: any) {
      alert(error?.response?.data?.message || 'Erro ao buscar lojistas.');
    } finally {
      setIsSearching(false);
    }
  }

  function updateLocalUser(userId: string, changes: Partial<User>) {
    setShopkeepers((currentUsers) =>
      currentUsers.map((shopkeeper) =>
        shopkeeper.id === userId ? { ...shopkeeper, ...changes } : shopkeeper,
      ),
    );
  }

  async function handleSave(shopkeeper: User) {
    if (savingUser) {
      return;
    }

    const merchantId = (shopkeeper.ifoodMerchantId || '').trim();
    if (shopkeeper.useIfoodIntegration && !merchantId) {
      alert('Informe o Merchant ID para ativar a integração iFood.');
      return;
    }

    setSavingUser(shopkeeper.user);

    try {
      await api.put(`/user/${shopkeeper.id}`, {
        useIfoodIntegration: Boolean(shopkeeper.useIfoodIntegration),
        usesExternalIfoodPdv:
          Boolean(shopkeeper.useIfoodIntegration) &&
          Boolean(shopkeeper.usesExternalIfoodPdv),
        ifoodMerchantId: merchantId,
      });
      if (shopkeeper.useIfoodIntegration && merchantId) {
        await api.post(`/ifood/sync-company/${shopkeeper.id}`).catch(() => undefined);
        alert(
          'Integração iFood salva. Os pedidos podem levar até 1 minuto para aparecer após ficarem prontos. Sincronização inicial iniciada.',
        );
      } else {
        alert('Configuração iFood salva com sucesso.');
      }
    } catch (error: any) {
      alert(error?.response?.data?.message || 'Erro ao salvar configuração iFood.');
    } finally {
      setSavingUser('');
    }
  }

  function updateCreditAmount(userId: string, value: string) {
    const parsedValue = Number(value);

    setCreditAmountByUser((current) => ({
      ...current,
      [userId]: Number.isNaN(parsedValue) ? 0 : parsedValue,
    }));
  }

  async function handleCreditAdjustment(shopkeeper: User, action: 'add' | 'remove') {
    if (savingUser) {
      return;
    }

    const amount = Number(creditAmountByUser[shopkeeper.id] || 0);
    if (!amount || amount < 1) {
      alert('Informe uma quantidade válida de créditos.');
      return;
    }

    setSavingUser(shopkeeper.user);

    try {
      const response = await api.post(`/ifood/credits/company/${shopkeeper.id}/${action}`, {
        amount,
      });

      updateLocalUser(shopkeeper.id, {
        ifoodOrdersReleased: response.data?.ifoodOrdersReleased ?? shopkeeper.ifoodOrdersReleased,
        ifoodOrdersUsed: response.data?.ifoodOrdersUsed ?? shopkeeper.ifoodOrdersUsed,
        ifoodOrdersAvailable: response.data?.ifoodOrdersAvailable ?? shopkeeper.ifoodOrdersAvailable,
      });

      alert(`Créditos ${action === 'add' ? 'adicionados' : 'removidos'} com sucesso.`);
    } catch (error: any) {
      alert(error?.response?.data?.message || 'Erro ao ajustar créditos.');
    } finally {
      setSavingUser('');
    }
  }

  async function handleLoadHistory(shopkeeper: User) {
    setLoadingHistoryUser(shopkeeper.id);
    try {
      const response = await api.get(`/ifood/credits/company/${shopkeeper.id}/history`);
      setHistoryByUser((current) => ({
        ...current,
        [shopkeeper.id]: Array.isArray(response.data?.history) ? response.data.history : [],
      }));
    } catch (error: any) {
      alert(error?.response?.data?.message || 'Erro ao carregar histórico.');
    } finally {
      setLoadingHistoryUser('');
    }
  }

  useEffect(() => {
    loadShopkeepers();
  }, []);

  useEffect(() => {
    if (!searchTerm.trim()) {
      return;
    }

    if (hasMoreShopkeepers && !isSearching) {
      loadAllShopkeepers();
    }
  }, [searchTerm, hasMoreShopkeepers, isSearching]);

  async function handleLoadMoreShopkeepers() {
    if (loading || loadingMore || !hasMoreShopkeepers) {
      return;
    }

    await loadShopkeepers(page + 1, true);
  }

  return (
    <Container>
      <Content>
        <Title>Empresas Cadastradas</Title>
        <Subtitle>
          Vincule cada lojista ao Merchant ID do iFood para permitir a importação
          dos pedidos corretamente.
        </Subtitle>

        <Input
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder="Pesquisar empresa por nome"
          value={searchTerm}
        />

        {loading || isSearching ? (
          <LoadingContainer>
            <Loader size={40} biggestColor="green" smallestColor="gray" />
          </LoadingContainer>
        ) : (
          filteredShopkeepers.length === 0 ? (
            <EmptyState>Nenhuma empresa encontrada para este nome.</EmptyState>
          ) : (
            filteredShopkeepers.map((shopkeeper) => (
            <Card key={shopkeeper.id}>
              <ShopkeeperName>{shopkeeper.name}</ShopkeeperName>

              <Actions>
                <Checkbox>
                  <input
                    checked={Boolean(shopkeeper.useIfoodIntegration)}
                    onChange={(event) =>
                      updateLocalUser(shopkeeper.id, {
                        useIfoodIntegration: event.target.checked,
                        usesExternalIfoodPdv: event.target.checked
                          ? Boolean(shopkeeper.usesExternalIfoodPdv)
                          : false,
                        ifoodMerchantId: event.target.checked
                          ? shopkeeper.ifoodMerchantId
                          : '',
                      })
                    }
                    type="checkbox"
                  />
                  Usar integração iFood
                </Checkbox>

                {shopkeeper.useIfoodIntegration && (
                  <Checkbox>
                    <input
                      checked={Boolean(shopkeeper.usesExternalIfoodPdv)}
                      onChange={(event) =>
                        updateLocalUser(shopkeeper.id, {
                          usesExternalIfoodPdv: event.target.checked,
                        })
                      }
                      type="checkbox"
                    />
                    Usa PDV externo integrado ao iFood?
                  </Checkbox>
                )}

                <div>
                  <MerchantIdLabel htmlFor={`merchant-${shopkeeper.id}`}>
                    Merchant ID
                  </MerchantIdLabel>
                  <Input
                    disabled={!shopkeeper.useIfoodIntegration}
                    id={`merchant-${shopkeeper.id}`}
                    onChange={(event) =>
                      updateLocalUser(shopkeeper.id, {
                        ifoodMerchantId: event.target.value,
                      })
                    }
                    placeholder="Ex.: 12345678-90ab-cdef-1234-567890abcdef"
                    value={shopkeeper.ifoodMerchantId || ''}
                  />
                </div>
                
                <CreditSummary>
                  <CreditLine>Liberados: {shopkeeper.ifoodOrdersReleased || 0}</CreditLine>
                  <CreditLine>Utilizados: {shopkeeper.ifoodOrdersUsed || 0}</CreditLine>
                  <CreditLine>Disponíveis: {shopkeeper.ifoodOrdersAvailable || 0}</CreditLine>
                </CreditSummary>

                <CreditButtons>
                  <CreditInput
                    min={1}
                    onChange={(event) => updateCreditAmount(shopkeeper.id, event.target.value)}
                    placeholder="Qtd. créditos"
                    type="number"
                    value={creditAmountByUser[shopkeeper.id] || ''}
                  />
                  <CreditButton
                    disabled={savingUser === shopkeeper.user}
                    onClick={() => handleCreditAdjustment(shopkeeper, 'add')}
                    type="button"
                  >
                    + Créditos
                  </CreditButton>
                  <CreditButton
                    disabled={savingUser === shopkeeper.user}
                    onClick={() => handleCreditAdjustment(shopkeeper, 'remove')}
                    type="button"
                  >
                    - Créditos
                  </CreditButton>
                  <HistoryButton
                    disabled={loadingHistoryUser === shopkeeper.id}
                    onClick={() => handleLoadHistory(shopkeeper)}
                    type="button"
                  >
                    {loadingHistoryUser === shopkeeper.id ? 'Carregando...' : 'Ver histórico'}
                  </HistoryButton>
                </CreditButtons>
              </Actions>

              <SaveButton
                disabled={savingUser === shopkeeper.user}
                onClick={() => handleSave(shopkeeper)}
                type="button"
              >
                {savingUser === shopkeeper.user ? (
                  <Loader size={20} biggestColor="gray" smallestColor="gray" />
                ) : (
                  'Salvar'
                )}
              </SaveButton>
              
              {Array.isArray(historyByUser[shopkeeper.id]) &&
                historyByUser[shopkeeper.id]?.length > 0 && (
                  <HistoryList>
                    {historyByUser[shopkeeper.id].slice(0, 5).map((entry: any) => (
                      <HistoryItem key={entry.id}>
                        {(() => {
                          const formattedDateTime = formatIfoodHistoryDateTime(entry.createdAt);

                          return (
                            <>
                        {translateIfoodOperationType(entry.operationType)} {entry.amount} crédito(s) em{' '}
                        {`${formattedDateTime.date} ${formattedDateTime.time}`}
                            </>
                          );
                        })()}
                      </HistoryItem>
                    ))}
                  </HistoryList>
                )}
            </Card>
            ))
          )
        )}

        {!loading && !searchTerm.trim() && hasMoreShopkeepers && (
          <LoadMoreButton disabled={loadingMore} onClick={handleLoadMoreShopkeepers} type="button">
            {loadingMore ? 'Carregando...' : 'Mostrar mais empresas'}
          </LoadMoreButton>
        )}
      </Content>
    </Container>
  );
}
